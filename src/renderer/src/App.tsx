import {
  DownloadOutlined,
  FolderOpenOutlined,
  PauseOutlined,
  PlayCircleOutlined
} from '@ant-design/icons'
import { Button, Card, Modal, Progress, Select, Space, Typography, message } from 'antd'
import React, { useEffect, useState } from 'react'
import { StyledInputChannel, StyledInputPath } from './styled'

const { Title } = Typography

const resolutions = [
  { value: 360, label: '360p' },
  { value: 480, label: '480p' },
  { value: 720, label: '720p' },
  { value: 1080, label: '1080p' }
]

const downloadTypes = [
  { value: 'all', label: 'Tất cả từ channel' },
  { value: 'videos', label: 'Videos' },
  { value: 'shorts', label: 'Shorts' },
  { value: 'playlists', label: 'Playlists' }
]

const App: React.FC = () => {
  const [channel, setChannel] = useState('')
  const [resolution, setResolution] = useState(720)
  const [downloadType, setDownloadType] = useState('videos')
  const [savePath, setSavePath] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSelectingFolder, setIsSelectingFolder] = useState(false)
  const [progress, setProgress] = useState<number | null>(null)
  const [speed, setSpeed] = useState('')
  const [eta, setEta] = useState('')
  const [filename, setFilename] = useState('')
  const [messageLog, setMessageLog] = useState('')
  const [isPaused, setIsPaused] = useState(false)

  const handleSelectFolder = async () => {
    setIsSelectingFolder(true)
    try {
      const folder = await window.api.selectFolder?.()
      if (folder) {
        setSavePath(folder)
      }
    } catch (err) {
      console.error('Error selecting folder:', err)
    } finally {
      setIsSelectingFolder(false)
    }
  }

  const handleDownload = async () => {
    if (!channel || !savePath) {
      message.warning('Vui lòng nhập kênh và chọn thư mục lưu.')
      return
    }

    try {
      setLoading(true)
      await window.api.downloadFromChannel(channel, resolution, savePath, downloadType)
      message.success('Tải xuống thành công!')
      await window.api.openFolder(savePath)
    } catch (error) {
      message.error('Có lỗi xảy ra. Liên hệ Thành để xử lý.')
    } finally {
      setLoading(false)
      setIsPaused(false)
    }
  }

  const togglePause = async () => {
    try {
      if (!isPaused) {
        await window.api.pauseDownload?.()
        setIsPaused(true)
      } else {
        await window.api.resumeDownload?.()
        setIsPaused(false)
      }
    } catch (err) {
      message.error('Không thể thay đổi trạng thái tải.')
    }
  }

  const handleCancel = async () => {
    Modal.confirm({
      title: 'Xác nhận hủy tải xuống',
      content: 'Bạn có chắc chắn muốn hủy quá trình tải xuống này?',
      okText: 'Hủy tải',
      cancelText: 'Không',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await window.api.cancelDownload?.()
          message.warning('Đã hủy tải xuống.')
          setProgress(null)
          setSpeed('')
          setEta('')
          setFilename('')
          setMessageLog('')
          setLoading(false)
          setIsPaused(false)
        } catch (err) {
          message.error('Không thể hủy tải.')
        }
      }
    })
  }

  useEffect(() => {
    const handlePasteShortcut = async (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        try {
          const text = await navigator.clipboard.readText()
          const inputValue = text.trim()
          const matched = inputValue.match(
            /(?:https?:\/\/)?(?:www\.)?youtube\.com\/@([a-zA-Z0-9-_]+)/
          )
          if (matched && matched[1]) {
            setChannel(matched[1])
          }
        } catch (err) {
          message.error('Có lỗi xảy ra khi dán URL')
        }
      }
    }

    window.addEventListener('keydown', handlePasteShortcut)
    return () => window.removeEventListener('keydown', handlePasteShortcut)
  }, [])

  useEffect(() => {
    const handleProgress = (data: any) => {
      if (data.type === 'progress') {
        setProgress(data.percent)
        setSpeed(data.speed)
        setEta(data.eta)
        setFilename(data.filename)
      } else if (data.type === 'log') {
        setMessageLog(data.message)
      } else if (data.type === 'done') {
        setProgress(null)
        setSpeed('')
        setEta('')
        setFilename('')
        setMessageLog('')
      }
    }

    if (window.api?.onDownloadProgress) {
      window.api.onDownloadProgress(handleProgress)
    }

    return () => {
      window.api?.removeProgressListener?.()
    }
  }, [])

  return (
    <Card style={{ margin: '40px' }}>
      <Title level={4}>YouTube Downloader</Title>

      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <StyledInputChannel
          placeholder="Nhập tên kênh hoặc URL..."
          value={channel}
          onChange={(e) => {
            const inputValue = e.target.value.trim()
            const matched = inputValue.match(
              /(?:https?:\/\/)?(?:www\.)?youtube\.com\/@([a-zA-Z0-9-_]+)/
            )
            if (matched && matched[1]) {
              setChannel(matched[1])
            } else {
              setChannel(inputValue)
            }
          }}
          addonAfter={
            <Select
              style={{ width: '100%' }}
              value={resolution}
              onChange={(value) => setResolution(value)}
              options={resolutions}
              disabled={loading}
            />
          }
          addonBefore="youtube.com/@"
          disabled={loading}
        />

        <Select
          value={downloadType}
          onChange={setDownloadType}
          options={downloadTypes}
          style={{ width: '100%' }}
          placeholder="Chọn loại nội dung cần tải"
          disabled={loading}
        />

        <StyledInputPath
          placeholder="Chọn thư mục lưu..."
          value={savePath}
          readOnly
          disabled={isSelectingFolder || loading}
          onClick={handleSelectFolder}
          addonAfter={
            <FolderOpenOutlined
              style={{
                cursor: isSelectingFolder ? 'not-allowed' : 'pointer',
                opacity: isSelectingFolder ? 0.5 : 1
              }}
              onClick={handleSelectFolder}
            />
          }
        />

        <Space direction="horizontal" style={{ width: '100%' }}>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            loading={loading}
            onClick={handleDownload}
            block
          >
            Tải xuống
          </Button>
          {loading && (
            <>
              <Button
                icon={isPaused ? <PlayCircleOutlined /> : <PauseOutlined />}
                onClick={togglePause}
                danger={isPaused}
              >
                {isPaused ? 'Tiếp tục' : 'Tạm dừng'}
              </Button>
              <Button danger onClick={handleCancel}>
                Hủy
              </Button>
            </>
          )}
        </Space>

        {progress !== null && (
          <Card size="small">
            <div>
              <strong>Đang tải:</strong> {filename}
            </div>
            <Progress percent={Math.round(progress)} />
            <div>
              <span>
                <strong>Tốc độ:</strong> {speed}
              </span>{' '}
              |{' '}
              <span>
                <strong>Ước tính:</strong> {eta}
              </span>
            </div>
          </Card>
        )}
        {!!messageLog && (
          <Card size="small">
            <div>
              <span>
                <strong>Logs:</strong> {messageLog}
              </span>
            </div>
          </Card>
        )}
      </Space>
    </Card>
  )
}

export default App
