/* toast() of circles.js: one #toast status line, created on first use, hides after 2.6 s */
import {createContext, useCallback, useContext, useRef, useState} from 'react';
import {createPortal} from 'react-dom';

const ToastCtx = createContext(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({children}) {
  const [msg, setMsg] = useState(null), [show, setShow] = useState(false), timer = useRef(0);
  const toast = useCallback(m => {
    setMsg(m); setShow(true);
    clearTimeout(timer.current); timer.current = setTimeout(() => setShow(false), 2600);
  }, []);
  return <ToastCtx.Provider value={toast}>
    {children}
    {msg !== null && createPortal(<div id="toast" className={'toast' + (show ? ' show' : '')} role="status">{msg}</div>, document.body)}
  </ToastCtx.Provider>;
}
