// import './LoginLeft/LoginLeft.scss';
// import './LoginRight/LoginRight.scss';

import React from 'react';
import { Outlet as LogInOutLet} from 'react-router-dom';


import LogInRight from './LogIn/LogInRight/LogInRight';

const SignIn = () => {
    return (
        <div className="login-container">
            <div className="login-wrapper">
                <LogInOutLet />
                <LogInRight />
            </div>
        </div>
    );
};

export default SignIn;