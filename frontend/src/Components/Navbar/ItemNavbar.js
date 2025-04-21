// src/components/ItemNavbar.js
import React, { useState } from 'react';
import { ListItem, ListItemIcon, ListItemText, Collapse, List } from '@mui/material';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { useNavigate } from 'react-router-dom';
import { COLOR_SELECT_ITEM, THEME_COLOR_FONT } from '../../Assets/Constants/constants';

function ItemNavbar({ icon, label, route, drawerOpen, showText, subItems, isSelected, onSelect }) {
  const [openSubItems, setOpenSubItems] = useState(false);
  const navigate = useNavigate();
  const [selectedItem, setSelectedItem] = useState(''); // Trạng thái của mục đã chọn

  const handleItemClick = () => {
    if (route) {
      onSelect(); // Gọi hàm onSelect khi nhấp vào mục
      navigate(route);
    } else {
      setOpenSubItems(!openSubItems);
    }
  };

  return (
    <>
      <ListItem

        onClick={handleItemClick}
        sx={{
          cursor: 'pointer',
          height: 56,
          backgroundColor: isSelected && subItems == null ? COLOR_SELECT_ITEM : 'transparent', // Thay đổi màu nền nếu được chọn
          color: isSelected && subItems == null ? THEME_COLOR_FONT : 'initial',
          "& > .MuiListItemIcon-root": {
            color: isSelected && subItems == null ? THEME_COLOR_FONT : 'initial',
          },
          '&:hover': {
            backgroundColor: COLOR_SELECT_ITEM,
            color: THEME_COLOR_FONT,
            "& > .MuiListItemIcon-root": {
              color: THEME_COLOR_FONT, // Màu của ListItemIcon khi hover
            },
          },
        }}
      >
        <ListItemIcon>{icon}</ListItemIcon>
        <ListItemText
          primary={label}
          sx={{ display: drawerOpen && showText ? 'block' : 'none' }}
        />
        {subItems && (openSubItems ? <ExpandLess /> : <ExpandMore />)}
      </ListItem>

      {/* SubItems rendering */}
      {subItems && (
        <Collapse in={openSubItems} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {subItems.map((subItem, index) => (
              <ListItem

                key={index}
                onClick={() => {
                  navigate(subItem.route);
                  onSelect(); // Gọi hàm onSelect khi bấm vào mục con
                  setSelectedItem(subItem.route)
                }}
                sx={{
                  pl: 4,
                  height: 56,
                  cursor: 'pointer',
                  backgroundColor: isSelected && selectedItem === subItem.route ? COLOR_SELECT_ITEM : 'transparent', // Thay đổi màu nền cho mục con
                  color: isSelected && selectedItem === subItem.route ? THEME_COLOR_FONT : 'initial',
                  "& > .MuiListItemIcon-root": {
                    color: isSelected && selectedItem === subItem.route ? THEME_COLOR_FONT : 'initial',
                  },
                  '&:hover': {
                    backgroundColor: COLOR_SELECT_ITEM,
                    color: THEME_COLOR_FONT,
                    "& > .MuiListItemIcon-root": {
                      color: THEME_COLOR_FONT, // Màu của ListItemIcon khi hover
                    },
                  },
                }}
              >
                <ListItemIcon>{subItem.icon}</ListItemIcon>
                <ListItemText
                  primary={subItem.label}
                  sx={{ display: drawerOpen && showText ? 'block' : 'none' }}
                />
              </ListItem>
            ))}
          </List>
        </Collapse>
      )}
    </>
  );
}

export default ItemNavbar;
