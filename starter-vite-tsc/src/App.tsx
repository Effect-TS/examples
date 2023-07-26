import { useState, useMemo, useCallback } from "react";
import reactLogo from "./assets/react.svg";
import "./App.css";
import { Effect } from "effect";

function App() {
  const [count, setCount] = useState(0);

  // Effect<never, never, void>
  const myeffect = useMemo(
    () => Effect.sync(() => setCount((current) => current + 1)),
    [setCount],
  );

  const increment = useCallback(() => Effect.runSync(myeffect), [myeffect]);

  return (
    <div className="App">
      <div>
        <a href="https://vitejs.dev" target="_blank">
          <img src="/vite.svg" className="logo" alt="Vite logo" />
        </a>
        <a href="https://reactjs.org" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={increment}>count is {count}</button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </div>
  );
}

export default App;
