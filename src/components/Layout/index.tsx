import './styles.scss';

import { Box } from '@mui/material';

import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../SideBar/SideBar';
import { TopBar } from '../TopBar/TopBar';
import LoginRight from '../../pages/LogIn/LogInRight/LogInRight';

export const AuthLayout : React.FC = () => {
    return (
        <div className='parent-container'>
        <div className="container">
            {/* <Sidebar />
           
                <TopBar name="Manikandan" /> */}
                <div className="main-content">
                    <Outlet />
                </div>
                 <div className="right-section">
                {/* Move LoginRight OUTSIDE of main-content to be its sibling */}
                <LoginRight className="login-right" />
            </div>
        </div>
        </div>
    );
};

