import styled from 'styled-components'
import { AiOutlineHome, AiOutlineLogout, AiOutlinePlus, AiOutlineEdit } from "react-icons/ai";
import { useState } from 'react';
import { Editor, EditorTextChangeEvent } from 'primereact/editor';
        

const PRIMARY_BACKGROUND = '#FFF';
const SECONDARY_BACKGROUND = '#000';
const TERTIARY_BACKGROUND = '#4F46E5';
const MAIN_SECTION_PRIMARY_BACKGROUND = '#F8FAFC';
const ICON_SIZE_BIG = 24;
const TEXT_SIZE_BIG = 24;
const ICON_COLOR = '#a4a8ad';

function App() {
  const [text, setText] = useState<string>('');

  return (
    <Grid>
      <Sidebar>
        <div className='title'>
          <strong>GEditor</strong>
        </div>

        <MenuList>
          <li><AiOutlineHome size={ICON_SIZE_BIG} color={ICON_COLOR} /> <strong>Inicio</strong></li>
          {/* <li><AiOutlineSetting size={ICON_SIZE_BIG} color={ICON_COLOR} /> <strong>Configurações</strong></li> */}
        </MenuList>

        <div className='user-info-line'>
          <UserInfo>
            <div className='user-info-image'><img src='https://i.pravatar.cc/150?img=5' alt='foto-perfil'/></div>
            <div className='user-info-name'>
              <strong>Ana Christiane Magalhaes</strong>
              <div>anachristianemagalhaes@hotmail.com</div>
            </div>
            <div className='user-info-logout'><AiOutlineLogout color='red'/></div>
          </UserInfo>
        </div>
      </Sidebar>

      <Header>
        <div className='active-tab'><AiOutlineHome size={ICON_SIZE_BIG} color={PRIMARY_BACKGROUND} /> <span>Inicio</span></div>
        <div className='tab'><AiOutlinePlus size={ICON_SIZE_BIG} color={SECONDARY_BACKGROUND} /> <span>Novo</span></div>
        <div className='user-info2'>
          <span>Olá, Ana Christiane Magalhaes</span>
          <div><img src='https://i.pravatar.cc/150?img=5' alt='foto-perfil'/></div>
        </div>
      </Header>

      <Main>
        
        <Container>
            <div className='title-text'>
              <input placeholder='Nome do arquivo'/>
              <AiOutlineEdit size={ICON_SIZE_BIG} color={ICON_COLOR}/>
            </div>

            <div className='editor'>
              <Editor value={text} onTextChange={(e: EditorTextChangeEvent) => setText(e.htmlValue!)} style={{ height: '40vh' }}/>
            </div>
        </Container>

      </Main>
    </Grid>
  )
}

const Grid = styled.div`
  display: grid;
  grid-template-columns: 20% minmax(auto, 100%);
  height: 100vh;
  grid-template-rows: 1fr 10fr;
`
const Sidebar = styled.div`
  background-color: ${PRIMARY_BACKGROUND};
  grid-row-start: 1;
  grid-row-end: 3;
  border-style: solid;
  border-width: 0 1px 0 0;
  border-right-color:#E2E8F0;
  height: 100%;

  display: flex;
  flex-direction: column;

  .title {
    padding: 10px 20px;

    strong {
      font-size: ${TEXT_SIZE_BIG}px;
    }
  }
`

const MenuList = styled.ul`
margin-top: 20px;
padding: 20px;

display: flex;
flex-direction: column;
flex-grow: 2;
li {
  display: flex;
  align-items: center;

  margin-top: 10px;
  cursor: pointer;

  strong {
    margin-left: 10px;
  }
}
`
const UserInfo = styled.div`
border-top: 1px solid #E2E8F0;
padding-top: 10px;
margin: 10px;

display: flex;
align-items: center;

.user-info-image {
  height: 50px;
  width: 50px;
  img {
    border-radius: 50%;
    height: 100%;
  }
}

.user-info-name {
  flex-direction: column;
  padding: 0 8px;
  div {
    word-break: break-all;
  }
}

.user-info-logout {
  margin-left: auto;
  margin-right: 10px;
  cursor: pointer;
}
`
const Header = styled.div`
 border-style: solid;
 border-width: 0 0 1px 0;
 background-color: ${PRIMARY_BACKGROUND};
 border-bottom-color:#E2E8F0;


 display: flex;
 align-items: center;

 .active-tab {
  background-color: ${TERTIARY_BACKGROUND};
  border-radius: 80px;
  padding: 8px 10px;
  margin: 0 10px 0 20px;
  cursor: pointer;

  display: flex;
  align-items: center;
  justify-content: center;

  span {
    color: ${PRIMARY_BACKGROUND};
    margin: 0 5px;
  }
 }

 .tab {
  border: 1px solid #E2E8F0;
  padding: 8px 10px;
  border-radius: 80px;
  cursor: pointer;

  display: flex;
  align-items: center;
  justify-content: center;

  span {
    margin: 0 5px;
  }
 }

 .user-info2 {
  margin-left: auto;
  margin-right: 20px;

  display: flex;
  flex-direction: row;
  align-items: center;

  span {
    margin-right: 10px;
  }

  div {
    height: 50px;
    width: 50px;

    img {
      border-radius: 50%;
      height: 100%;
    }
  }
 }
`

const Main = styled.div`
  background-color: ${MAIN_SECTION_PRIMARY_BACKGROUND};
  padding-top: 30px;
`
const Container = styled.div`
  box-sizing: border-box;
  margin-left: 30px;
  height: 100%;
  width: 50%;
  .title-text {
    display: flex;
    justify-items: center;
    padding: 15px;
    border-radius: 16px;
    border: 1px solid #CBD5E1;
    background: #FFF;
    box-shadow: 0px 4px 8px -2px rgba(23, 23, 23, 0.10), 0px 2px 4px -2px rgba(23, 23, 23, 0.06);
    input {
      font-size: ${TEXT_SIZE_BIG}px;
      font-weight: 400;
      outline: none;
      width: 96%;
      border: 0;
    }
  }
  .editor {
    margin-top: 30px;
    border-radius: 8px;
    background: #FFF;
    box-shadow: 0px 4px 8px -2px rgba(23, 23, 23, 0.10), 0px 2px 4px -2px rgba(23, 23, 23, 0.06); 
  }
`

export default App
