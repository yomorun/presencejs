import { useState, useEffect, useRef } from 'react';

export function Window() {
  const [url, setUrl] = useState();
  const frameRef = useRef();
  const reload = () => {
    if (frameRef.current) {
      frameRef.current.contentWindow.postMessage('reload', url);
    }
  };
  const back = () => {
    if (frameRef.current) {
      frameRef.current.contentWindow.postMessage('back', url);
    }
  };
  const forward = () => {
    if (frameRef.current) {
      frameRef.current.contentWindow.postMessage('forward', url);
    }
  };
  useEffect(() => {
    if (typeof window === 'undefined') return;
  }, []);
  return (
    <div className="flex flex-col w-[full] h-[full]">
      <div className="flex h-[40px] p-[4px] bg-slate-900 text-slate-100">
        <div className="flex items-center gap-2 w-[80px]">
          <div className="w-[20px]" onClick={back}>
            <svg
              className="fill-slate-500"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 448 512"
            >
              <path d="M447.1 256C447.1 273.7 433.7 288 416 288H109.3l105.4 105.4c12.5 12.5 12.5 32.75 0 45.25C208.4 444.9 200.2 448 192 448s-16.38-3.125-22.62-9.375l-160-160c-12.5-12.5-12.5-32.75 0-45.25l160-160c12.5-12.5 32.75-12.5 45.25 0s12.5 32.75 0 45.25L109.3 224H416C433.7 224 447.1 238.3 447.1 256z" />
            </svg>
          </div>
          <div className="w-[20px]" onClick={forward}>
            <svg
              className="fill-slate-500"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 448 512"
            >
              <path d="M438.6 278.6l-160 160C272.4 444.9 264.2 448 256 448s-16.38-3.125-22.62-9.375c-12.5-12.5-12.5-32.75 0-45.25L338.8 288H32C14.33 288 .0016 273.7 .0016 256S14.33 224 32 224h306.8l-105.4-105.4c-12.5-12.5-12.5-32.75 0-45.25s32.75-12.5 45.25 0l160 160C451.1 245.9 451.1 266.1 438.6 278.6z" />
            </svg>
          </div>
          <div className="w-[20px]" onClick={reload}>
            <svg
              className="fill-slate-200"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 512 512"
            >
              <path d="M496 48V192c0 17.69-14.31 32-32 32H320c-17.69 0-32-14.31-32-32s14.31-32 32-32h63.39c-29.97-39.7-77.25-63.78-127.6-63.78C167.7 96.22 96 167.9 96 256s71.69 159.8 159.8 159.8c34.88 0 68.03-11.03 95.88-31.94c14.22-10.53 34.22-7.75 44.81 6.375c10.59 14.16 7.75 34.22-6.375 44.81c-39.03 29.28-85.36 44.86-134.2 44.86C132.5 479.9 32 379.4 32 256s100.5-223.9 223.9-223.9c69.15 0 134 32.47 176.1 86.12V48c0-17.69 14.31-32 32-32S496 30.31 496 48z" />
            </svg>
          </div>
        </div>

        <input
          className="flex-1 px-4 py-1 outline-none text-slate-100 bg-slate-700 border-2 border-slate-700 rounded-[20px] hover:border-blue-400"
          onKeyDown={evt => {
            if (evt.keyCode === 13) setUrl(evt.target.value);
          }}
        />
      </div>

      <iframe
        ref={frameRef}
        className="flex-1"
        src={url}
        frameBorder="0"
      ></iframe>

      <div className="h-[30px] leading-[30px] px-[4px] text-slate-200 bg-slate-700">
        Console
      </div>
    </div>
  );
}
