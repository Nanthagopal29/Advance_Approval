import {
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";
import Admin from "./components/auth/admin";
import Home from "./components/pages/home";
import Login from "./components/auth/login";
import Request from "./components/pages/request";
import Approve from "./components/pages/approve";
import Statement from "./components/pages/statement";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/home" element={<Home />} />
        <Route path="/request" element={<Request />} />
        <Route path="/approve" element={<Approve />} />
        <Route path="/statement" element={<Statement />} />
      </Routes>
    </Router>
  );
}

export default App