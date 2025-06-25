import {Suspense} from "react";
import { RouterProvider} from "react-router";
import router from "./routes.tsx";

const App = () => {
  return (
    <div className="content">
      <Suspense fallback={<div>loading...</div>}>
      <RouterProvider router={router} />
      </Suspense>
    </div>
  );
};

export default App;
