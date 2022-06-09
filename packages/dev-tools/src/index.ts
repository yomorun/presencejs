(() => {
  if (typeof window === 'undefined') return;
  new Proxy(console, {
    get(target, prop: 'log' | 'info' | 'warn' | 'error') {
      if (prop === 'log' || 'info' || 'warn' || 'error') {
        return (...args: any[]) => {
          window.postMessage({ prop, ...args }, '*');
          if (prop in target) target[prop](...args);
        };
      }
      return target[prop];
    },
  });

  window.addEventListener('message', (evt: MessageEvent) => {
    if (evt.data === 'reload') {
      window.history.go(0);
    }
    if (evt.data === 'back') {
      window.history.back();
    }
    if (evt.data === 'forward') {
      window.history.forward();
    }
  });
})();
