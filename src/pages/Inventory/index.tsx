// // import './styles.scss';

// // import { Box } from '@mui/material';

// // import React from 'react';
// // import { Outlet } from 'react-router-dom';
// // import { Sidebar } from '../SideBar/SideBar';
// // import { TopBar } from '../TopBar/TopBar';
// // import LoginRight from '../../pages/LogIn/LogInRight/LogInRight';

// // export const Layout: React.FC = () => {
// //     return (
// //         <div className='parent-container'>
// //         <div className="container">
// //             <Sidebar />

// //                 <TopBar name="Manikandan" />
// //                 <div className="main-content">
// //                     <Outlet />
// //                 </div>
// //                  <div className="right-section">
// //                 {/* Move LoginRight OUTSIDE of main-content to be its sibling */}
// //                 <LoginRight className="login-right" />
// //             </div>
// //         </div>
// //         </div>
// //     );
// // };

// // components/layout/index.tsx

// // components/layout/index.tsx
// // components/layout/index.tsx

// // import './styles.scss';
// import { Box } from '@mui/material';
// import React from 'react';
// import { Outlet } from 'react-router-dom';
// import { Sidebar } from '../../components/SideBar/SideBar';
// import { TopBar } from '../../components/TopBar/TopBar';

// const Dashboard: React.FC = () => {
//     return (
//         <div >
//             <div >
//                 <Sidebar />
//                 {/* This new Box groups the TopBar and main content. */}
//                 <Box >
//                     <TopBar name="Manikandan" />
//                     </Box>
//                     <div >
//                         <Outlet />
//                     </div>
                
//             </div>
//         </div>
//     );
// };

// export default Dashboard;

import React from 'react';
import { Box } from '@mui/material';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../../components/SideBar/SideBar';
import { TopBar } from '../../components/TopBar/TopBar';

const InventoryPage : React.FC = () => {
    return (
        <Box display="flex" height="100vh">
            {/* Sidebar stays fixed on the left */}
            <Sidebar />

            {/* Main content area */}
            <Box flexGrow={1} display="flex" flexDirection="column">
                {/* TopBar stays fixed at the top of main area */}
                <TopBar name="Manikandan" />

                {/* Content area below TopBar changes with routing */}
                <Box component="main" flexGrow={1} p={2} overflow="auto">
                    <Outlet />
                </Box>
            </Box>
        </Box>
    );
};

export default InventoryPage ;
