
import './Sidebar.scss';

import { Box, IconButton, Typography, Divider } from '@mui/material';
import React, { useState } from 'react';

import ArrowIcon from '../../assets/Arrow.svg';
import BoxIcon from '../../assets/Box.svg';
import CheckBoxIcon from '../../assets/CheckBox.svg';
import DollarIcon from '../../assets/Dollor.svg';
import GearIcon from '../../assets/Gear.svg'; 
import GroupIcon from '../../assets/Group.svg';
import HumanIcon from '../../assets/Human.svg';
import MailIcon from '../../assets/Mail.svg';
import VectorIcon from '../../assets/Vector.svg';
import SettingsIcon from '../../assets/Setting.svg'; 


interface SidebarItem {
  id: string;
  icon: string;
  alt: string;
  iconWidth: string;
  iconHeight: string;
  marginTop: string;
}

const sidebarItems: SidebarItem[] = [
  
  { id: 'group', icon: GroupIcon, alt: 'Group', iconWidth: '32px', iconHeight: '32px', marginTop: '0px' },
  
  { id: 'vector', icon: VectorIcon, alt: 'Vector', iconWidth: '24px', iconHeight: '24px', marginTop: '5px' }, 
  { id: 'dollar', icon: DollarIcon, alt: 'Dollar', iconWidth: '24px', iconHeight: '24px', marginTop: '5px' }, 
  { id: 'box', icon: BoxIcon, alt: 'Box', iconWidth: '24px', iconHeight: '24px', marginTop: '5px' },
  { id: 'human', icon: HumanIcon, alt: 'Human', iconWidth: '26px', iconHeight: '26px', marginTop: '5px' },
  { id: 'mail', icon: MailIcon, alt: 'Mail', iconWidth: '24px', iconHeight: '24px', marginTop: '5px' },
  { id: 'checkbox', icon: CheckBoxIcon, alt: 'CheckBox', iconWidth: '24px', iconHeight: '24px', marginTop: '5px' },
  { id: 'arrow', icon: ArrowIcon, alt: 'Arrow', iconWidth: '24px', iconHeight: '24px', marginTop: '5px' },
  { id: 'gear', icon: GearIcon, alt: 'Gear', iconWidth: '24px', iconHeight: '24px', marginTop: '5px' }
  
];

export const Sidebar: React.FC = () => {
  const [activeItemId, setActiveItemId] = useState<string>('vector');

  return (
    <Box sx={{ display: 'flex', height: '100vh', }}>
      <Box
        className="sidebar"
        sx={{
          overflow: 'hidden',
          flexShrink: 0,
          backgroundColor: '#5C17E5',
          paddingTop: '10px',
          zIndex: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 0,
          color: 'white',
          // overflowY: 'auto', 
        }}
      >
       
        {sidebarItems.map(item => (
          <React.Fragment key={item.id}>
            <Box
              onClick={() => setActiveItemId(item.id)}
              className={`sidebar-item ${activeItemId === item.id ? 'sidebar-item-active' : ''}`}
              sx={{
                marginTop: item.marginTop,
              }}
            >
              <IconButton
                sx={{
                  padding: 0,
                  borderRadius: '0px',
                }}
              >
                <img
                  src={item.icon}
                  alt={item.alt}
                  style={{ width: item.iconWidth, height: item.iconHeight }}
                />
              </IconButton>
            </Box>
            
            {(item.id === 'human' || item.id === 'arrow') && (
              <Divider
                sx={{
                  width: '27px',
                  height: '1px',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  margin: '2px 0', 
                }}
              />
            )}
          </React.Fragment>
        ))}

        
        <Box
          sx={{
            marginTop: 'auto', 
            paddingBottom: '24px' 
          }}
        >
          <IconButton className="settings-icon-border">
            <img
              src={SettingsIcon} 
              alt="Settings"
              style={{ width: '24.91px', height: '24px' }} 
            />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
};