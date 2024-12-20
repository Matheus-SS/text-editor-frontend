/* eslint-disable @typescript-eslint/no-explicit-any */
import styled from 'styled-components'
import { AiOutlineHome, AiOutlineLogout, AiOutlinePlus, AiOutlineEdit, AiOutlineSave } from "react-icons/ai";
import { ChangeEvent, useCallback, useEffect, useRef, useState } from 'react';
import { SocketConnection} from './socket';
import { SignInButton, useAuth, useUser } from '@clerk/clerk-react';
import axios from 'axios';
import { z } from "zod";
import toast, { Toaster } from 'react-hot-toast';

type Ok<T> = {
  data: T,
  success: true
};

type Err = {
  error: string,
  message: string,
  success: false
}

type Result<T> = Ok<T> | Err

type Doc = {
  _id: string;
  authorId: string;
  text: string;
  title: string;
}

type ModalProps = {
  dialogRef: React.LegacyRef<HTMLDialogElement>;
  onClose: (value?: string) => void;
}
const PRIMARY_BACKGROUND = '#FFF';
const SECONDARY_BACKGROUND = '#000';
const TERTIARY_BACKGROUND = '#4F46E5';
const MAIN_SECTION_PRIMARY_BACKGROUND = '#F8FAFC';
const ICON_SIZE_BIG = 24;
const TEXT_SIZE_BIG = 24;
const ICON_COLOR = '#a4a8ad';

function updateUrl(paramName: string, paramValue: string) {
  const url = new URL(window.location.href);
  url.searchParams.set(paramName, paramValue);
  window.history.pushState({}, '', url.toString());
}

function clearUrl() {
  window.history.replaceState(null, '', window.location.pathname);
};

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

function Modal({ dialogRef, onClose }: ModalProps) {
  return (
    <ContainerModal ref={dialogRef}>
      <h4>Documento foi alterado, deseja salvar o arquivo?</h4>
      <div className='modal-btn-container'>
        <button className='modal-btn-yes' onClick={() => onClose('yes')}>Sim</button>
        <button className='modal-btn-cancel' onClick={() => onClose('cancel')}>Cancelar</button>
        <button className='modal-btn-no' onClick={() => onClose()}>Não</button>
      </div>
  </ContainerModal>
  )
}
function Home() {
  const socketConnection = SocketConnection.getInstance();
  const { signOut, getToken } = useAuth();
  const { user } = useUser();
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [isConnected, setIsConnected] = useState(Boolean(socketConnection.getSocket()?.connected));
  const [text, setText] = useState<string>('');
  const [textLoaded, setTextLoaded] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [titleLoaded, setTitleLoaded] = useState<string>('');
  const [currentURLDocId, setCurrentURLDocId] = useState('');
  const [document, setDocument] = useState<Doc>();
  const [listDoc, setListDoc] = useState<Doc[]>([]);
  const [isNewButtonActive, setIsNewButtonActive] = useState<boolean>(false);

  const [loadingApi, setLoadingApi] = useState(true);
  const [loadingSocket, setLoadingSocket] = useState(true);

  const [token, setToken] = useState<string>(); 

  const onHandleText = useCallback((e:any) => {
    setText(e.target.value);
    console.log("SOCKET", socketConnection.getSocket()?.id)
    socketConnection.getSocket()?.emit('editor-change', e.target.value)
  }, [socketConnection]);

  const onHandleTitle = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  }, []);

  const openDoc = (_id: string) => {
    socketConnection.getSocket()?.emit('server.document.open', _id, (response: { data: Doc, success: boolean }) => {
      if (response.success === false) {
        setText('');
        setTitle('');
        toast.error('Documento nao encontrado');
        return;
      }
      updateUrl('doc', response.data._id)
      setText(response.data.text);
      setTitle(response.data.title);
      setTextLoaded(response.data.text);
      setTitleLoaded(response.data.title);
      setCurrentURLDocId(response.data._id);
      setIsNewButtonActive(true)
    });
  }

  function isTextSame() {
    const newTextToSave = text.split(' ');
    const originalTextSplit = textLoaded.split(' ');
    console.log('newTextToSave',newTextToSave);
    console.log('originalTextSplit',originalTextSplit);

    if (newTextToSave.length !== originalTextSplit.length) {
      return false;
    }

    let i = 0;
    while(i < originalTextSplit.length) {
      if (originalTextSplit[i] !== newTextToSave[i]) {
        return false;
      }
      i++;
    }
    return true;
  };

  function isTitleSame() {
    const newTitleToSave = title.split(' ');
    const originalTitleSplit = titleLoaded.split(' ');
    console.log('newTitleToSave',newTitleToSave)
    console.log('originalTitleSplit',originalTitleSplit)

    if (newTitleToSave.length !== originalTitleSplit.length) {
      return false;
    }

    let i = 0;

    while(i < originalTitleSplit.length) {
      if (originalTitleSplit[i] !== newTitleToSave[i]) {
        return false;
      }
      i++;
    }
    return true;
  };

  console.log("docs", document)
  const onHandleSave = (update?: boolean) => {
    const Document = z.object({
      title: z.string().min(2, {
        message: 'Título no mínimo 2 caracteres'
      }).max(20, {
        message: 'Título no máximo 20 caracteres'
      }),
      text: z.string().min(2, {
        message: 'Texto no mínimo 2 caracteres'
      }).max(1000, {
        message: 'Texto no máximo 1000 caracteres'
      })
    });

    const doc = Document.safeParse({ title: title?.trim(), text: text?.trim()})
    let obj;
    if (doc.success === false) {
      console.log("doc", doc.error.issues);
      const error = doc.error.issues.map(d => d.message);
      const err= error.join('\n')
      toast.error(err, {
        position: 'top-right'
      })
      console.log(err);
      return;
    } else {
      const params = new URLSearchParams(window.location.search);
      const docId = params.get('doc');
      obj = {
        docId: docId || currentURLDocId,
        title: doc.data.title,
        text: doc.data.text
      }
    }
    console.log("OBJ", obj);
    console.log("text", text)
    if (update) {
      socketConnection.getSocket()?.emit('client.document.update', obj);
      return
    }
    socketConnection.getSocket()?.emit('client.document.save', obj);
  };

  function clearFields() {
    setTitle('');
    setText('');
  }

  function closeDialog(value?: string) {
    if (dialogRef.current && value === 'cancel') {
      dialogRef.current.close();
    } else if (dialogRef.current && value === 'yes') {
      onHandleSave(true);
      clearFields();
      clearUrl();
      console.log("MODAL SAVE");
      setIsNewButtonActive(false);
      dialogRef.current?.close();
    } else {
      clearUrl();
      clearFields();
      dialogRef.current?.close();
      setIsNewButtonActive(false);
    }
  };

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
        const params = new URLSearchParams(window.location.search);
        const docId = params.get('doc');

        if (docId) {
          openDoc(docId);
        }

        // lidar com texto do textarea
        socketConnection.getSocket()?.on('update-editor-change', (serverContent: string) => {
          console.log("mensagem do servidor: ", serverContent);
          setText(serverContent);
        });

        // listar os texto no side bar
        socketConnection.getSocket()?.emit('server.document.list', (response: Result<Doc[]>) => {
          if (response.success === true) {
            console.log("response EMIT server.document.list", response);
            setListDoc(response.data);
          }
        });

        // receber os dados de quando salva um novo documento
        socketConnection.getSocket()?.on('server.document.list', (response: Result<Doc[]>) => {
          if (response.success === false) {
            toast.error(response.message);
            return;
          }
          console.log("response ON server.document.list", response);
          setListDoc(response.data);
          setIsNewButtonActive(true);
          const lastInsertedDoc = response.data[response.data.length - 1];
          setText(lastInsertedDoc.text);
          setTextLoaded(lastInsertedDoc.text);
          setTitle(lastInsertedDoc.title);
          setTitleLoaded(lastInsertedDoc.title);

          updateUrl('doc', lastInsertedDoc._id);
          toast.success('Documento salvo com sucesso')
        });

        // receber os dados de quando atualiza um novo documento
        socketConnection.getSocket()?.on('server.document.update', (response: Result<Doc[]>) => {
          if (response.success === false) {
            toast.error(response.message);
            return;
          }
          console.log("response ON server.document.update", response);
          setListDoc(response.data);
          toast.success('Documento salvo com sucesso')
        });

        return () => {
          socketConnection.getSocket()?.off('server.document.list');
          socketConnection.getSocket()?.off('server.document.update');
          socketConnection.getSocket()?.off('update-editor-change');
        };
      }
    },[socketConnection, token]);


  const handleLogout = async () => {
    await signOut()
  }

  function handleNewDocButton() {
    if(isTextSame() && isTitleSame()) {
      setIsNewButtonActive(false);
      clearUrl();
      clearFields();
      setCurrentURLDocId('');
      return;
    } else {
      dialogRef.current?.showModal();
    }
  }

  return (
    <>
      {loadingApi || loadingSocket ? (
        <Loading />
      ): (
        <Grid>
          <Modal dialogRef={dialogRef} onClose={closeDialog}/>
          
          <Sidebar>
            <div className='title'>
              <strong>GEditor</strong>
            </div>

            <MenuList className='menu-list'>
              <li className='menu-item'>
                <AiOutlineHome size={ICON_SIZE_BIG} color={ICON_COLOR} />
                <strong>Inicio</strong>
              </li>
              <ul className='sublist'>
                {listDoc.map((d) => (
                  <li className='sublist-item' key={d._id} onClick={() => openDoc(d._id)}>{d.title}</li>
                ))}
              </ul>
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
            {isNewButtonActive && <div className='tab' onClick={handleNewDocButton}><AiOutlinePlus size={ICON_SIZE_BIG} color={SECONDARY_BACKGROUND}/> <span>Novo</span></div> }
            <div className='user-info2'>
              <div className='save'onClick={() => onHandleSave()}><AiOutlineSave size={ICON_SIZE_BIG} color={PRIMARY_BACKGROUND}/> <span>Salvar</span></div>
              <div className='user-info2-image'><img src={user?.imageUrl || 'https://i.pravatar.cc/150?img=5'} alt='foto-perfil'/></div>
            </div>
          </Header>

          <Main>
            <form>
            <Container>
                <div className='title-text'>
                  <input 
                    placeholder='Titulo' 
                    value={title} 
                    onChange={onHandleTitle} 
                    minLength={2} 
                    maxLength={20}
                    required  
                  />
                  <AiOutlineEdit size={ICON_SIZE_BIG} color={ICON_COLOR}/>
                </div>

                <div>
                  <textarea 
                    value={text} 
                    onChange={onHandleText} 
                    className='editor'
                    minLength={2} 
                    maxLength={1000}
                    required 
                  ></textarea>
                </div>
            </Container>
            </form>
          </Main>
        </Grid>
      )}
      <Toaster />
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

const MenuList = styled.ul.attrs({
  className: 'menu-list'
})`
  margin-top: 20px;
  padding: 20px;

  display: flex;
  flex-direction: column;
  flex-grow: 2;

  .menu-item {
    display: flex;
    align-items: center;

    margin-top: 10px;
    cursor: pointer;

    strong {
      margin-left: 10px;
    }
  }

  .sublist {
    list-style: none;
    .sublist-item {
      cursor: pointer;
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
const ContainerModal = styled.dialog`
  margin: 10% auto;
  max-width: 350px;
  background-color: #fff;
  border: 0;
  border-radius: 5px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);

  &::backdrop {
    background-color: rgba(0, 0, 0, 0.5); /* Backdrop background */
  }
  .modal-btn-container {
    display: flex;
    justify-content: space-evenly;
    
    button {
      background-color: #c5c7c6;
      font-weight: 700;
      border: 0;
      font-size: 16px;
      padding: 10px;
      flex: 1;
      border-radius: 8px;
      margin: 0 5px;
      color: #fff;
      cursor: pointer;
      transition: 0.5s;

      &:focus {
        outline: none; 
      }
      &:hover {
        background-color: rgba(0, 0, 0, 0.5);
      }
    }
  }
 
`

export default App
