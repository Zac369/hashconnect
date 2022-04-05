import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link} from 'react-router-dom';

import Login from './components/Login/Login';

const App = () => {
  return (
    <div className="bg-gray-100 min-h-screen">
      <Router>
        <nav className="bg-blue-500 container flex justify-around py-5 mx-auto text-red text-xl max-w-full">
          <Link to="/">Login Page</Link>
        </nav>

        <Routes>
          <Route path="/" element={<Login/>}/>
        </Routes>
      </Router>
    </div>
  )
}

export default App