import React from 'react';

const Login = () => {
  const loginAction = () => async () => {
      console.log('loginAction');
  }

  return (
      <div className="grid place-items-center">
          <button className="text-2xl flex my-5 bg-gray-500 rounded-md p-2 hover:text-white" onClick={loginAction()}>Login With HashPack</button>
      </div>
  )
}

export default Login