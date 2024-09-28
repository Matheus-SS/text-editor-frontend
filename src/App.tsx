/* eslint-disable @typescript-eslint/no-explicit-any */
import styled from 'styled-components'
import { AiOutlineHome, AiOutlineLogout, AiOutlinePlus, AiOutlineEdit, AiOutlineSave } from "react-icons/ai";
import { useCallback, useEffect, useState } from 'react';
import { SocketConnection} from './socket';
import { SignInButton, useAuth, useUser } from '@clerk/clerk-react';
import axios from 'axios';

const PRIMARY_BACKGROUND = '#FFF';
const SECONDARY_BACKGROUND = '#000';
const TERTIARY_BACKGROUND = '#4F46E5';
const MAIN_SECTION_PRIMARY_BACKGROUND = '#F8FAFC';
const ICON_SIZE_BIG = 24;
const TEXT_SIZE_BIG = 24;
const ICON_COLOR = '#a4a8ad';

function Loading() {
  return (
    <Load>
      <h2 data-text="Carregando...">Carregando...</h2>
    </Load>
  )
}
function Login() {
  return (
    <header>
      <SignInButton />
    </header>
  );
}

function Home() {
  const socketConnection = SocketConnection.getInstance();
  const { signOut, getToken } = useAuth();
  const { user } = useUser();

  const [isConnected, setIsConnected] = useState(Boolean(socketConnection.getSocket()?.connected));
  const [text, setText] = useState<string | null>('');
  const [title, setTitle] = useState<string | null>('');

  const [loadingApi, setLoadingApi] = useState(true);
  const [loadingSocket, setLoadingSocket] = useState(true);

  const [token, setToken] = useState<string>();

  const onHandleText = useCallback((e:any) => {
    setText(e.target.value);
    console.log("SOCKET", socketConnection.getSocket()?.id)
    socketConnection.getSocket()?.emit('editor-change', e.target.value)
  }, [socketConnection])



  useEffect(() => {
    async function fetchToken() {
      setLoadingApi(true);
      setLoadingSocket(true)
      try {
        const data = await getToken();
        const response = await axios.get('http://localhost:3000/secure', {
          headers: {
            Authorization: `Bearer ${data}`
          }
        });
        setToken(response.data.token);
        setLoadingApi(false);
      } catch (error) {
        console.log("error", error);
        setLoadingSocket(false);
      } finally {
        setLoadingApi(false);
      }
    }

    fetchToken()
  },[]);

  useEffect(() => { 
    if (token) {
      socketConnection.connect(token);
      function onConnect() {
        setIsConnected(true);
        setLoadingSocket(false)
      }
    
      function onDisconnect() {
        setIsConnected(false);
      } 
      
      socketConnection.getSocket()?.on('connect', onConnect);
      socketConnection.getSocket()?.on('disconnect', onDisconnect);
    
      return () => {
        socketConnection.getSocket()?.off('connect', onConnect);
        socketConnection.getSocket()?.off('disconnect', onDisconnect);
      }
    }
  },[socketConnection, token]);

    useEffect(() => {
      if (token) {
        socketConnection.getSocket()?.on('update-editor-change', (serverContent: string) => {
          console.log("mensagem do servidor: ", serverContent)
          const value = serverContent
          setText(value)
        });

        return () => {
          socketConnection.getSocket()?.off('update-editor-change');
        };
      }
    },[socketConnection, token]);



  const handleLogout = async () => {
    await signOut()
  }

  return (
    <>
      {loadingApi || loadingSocket ? (
        <Loading />
      ): (
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
                <div className='user-info-image'><img src={user?.imageUrl || 'https://i.pravatar.cc/150?img=5'} alt='foto-perfil'/></div>
                <div className='user-info-name'>
                  <strong>{user?.fullName}</strong>
                  <div>{user?.primaryEmailAddress?.emailAddress}</div>
                </div>
                <div className='user-info-logout' onClick={handleLogout}><AiOutlineLogout color='red'/></div>
              </UserInfo>
            </div>
          </Sidebar>

          <Header>
            <div className='active-tab'><AiOutlineHome size={ICON_SIZE_BIG} color={PRIMARY_BACKGROUND} /> <span>Inicio</span></div>
            <div className='tab'><AiOutlinePlus size={ICON_SIZE_BIG} color={SECONDARY_BACKGROUND} /> <span>Novo</span></div>
            <div className='user-info2'>
              <div className='save'><AiOutlineSave size={ICON_SIZE_BIG} color={PRIMARY_BACKGROUND}/> <span>Salvar</span></div>
              <div className='user-info2-image'><img src={user?.imageUrl || 'https://i.pravatar.cc/150?img=5'} alt='foto-perfil'/></div>
            </div>
          </Header>

          <Main>
            
            <Container>
                <div className='title-text'>
                  <input placeholder='Titulo'/>
                  <AiOutlineEdit size={ICON_SIZE_BIG} color={ICON_COLOR}/>
                </div>

                <div>
                  <textarea value={text!} onChange={onHandleText} className='editor'></textarea>
                </div>
            </Container>

          </Main>
        </Grid>
      )}
    </>
  )
}
function App() {
  const { isSignedIn } = useAuth();
  const COMPONENT = isSignedIn ? <Home /> : <Login />;
  return COMPONENT;
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

  .save {
    background-color: ${TERTIARY_BACKGROUND};
    border-radius: 80px;
    padding: 8px 10px;
    margin: 0 10px 0 20px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${PRIMARY_BACKGROUND};

    span {
      margin-left: 5px;
    }
  }

  .user-info2-image {
    position: relative;
    height: 50px;
    width: 50px;

    img {
      border-radius: 50%;
      height: 100%;
    }
    &::before {
      content: '';
      height: 15px;
      width: 15px;
      position: absolute;
      border-radius: 50%;
      background-color: #36cf36;
      right: 0px;
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
    border-radius: 8px;
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
    width: 100%;
    height: 40vh;
    margin-top: 30px;
    border-radius: 8px;
    border: 1px solid #CBD5E1;
    background: #FFF;
    box-shadow: 0px 4px 8px -2px rgba(23, 23, 23, 0.10), 0px 2px 4px -2px rgba(23, 23, 23, 0.06); 
  }
`;

const Load = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: ${MAIN_SECTION_PRIMARY_BACKGROUND};

  h2 {
    position: relative;
    font-size: 9vw;
    color: ${MAIN_SECTION_PRIMARY_BACKGROUND};
    -webkit-text-stroke: 0.3vw ${TERTIARY_BACKGROUND};
    text-transform: uppercase;

    &::before {
      content: attr(data-text);
      position: absolute;
      top: 0;
      left: 0;
      width: 0;
      height: 100%;
      color: ${TERTIARY_BACKGROUND};
      border-right: 2px solid ${TERTIARY_BACKGROUND};
      overflow: hidden;
      animation: animate 3s linear infinite;
    }
    @keyframes animate {
      0%{
        width: 0;
      }
      70%{
        width: 100%;
      }
    }
  }
`

export default App
