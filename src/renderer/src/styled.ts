import { Input } from 'antd'
import styled from 'styled-components'

export const StyledInputChannel = styled(Input)`
  .ant-input-group-addon:last-child {
    min-width: 110px;
    padding: 0px;
  }
`

export const StyledInputPath = styled(Input)`
  .ant-input-group-addon {
    min-width: 50px;
    padding: 0px;

    & > span {
      width: 100%;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }
`
