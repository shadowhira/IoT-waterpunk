import React from 'react';
import { Grid, Paper, Typography, Avatar, Box } from '@mui/material';
import defaultAvatar from '../Assets/Images/defaultAvatar.png'; // Adjust the path as necessary
import { MARGIN_HEADING } from '../Assets/Constants/constants';

function Welcome({ user }) {
  const avatarSrc = user.avatar || defaultAvatar; // Use user's avatar or default image

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%', // Height of the main container
        marginTop: MARGIN_HEADING/8
      }}
    >
      <Grid container spacing={2} justifyContent="center" alignItems="center">
        <Grid item xs={12}>
          <Typography variant="h1" align="center" gutterBottom sx={{ color: '#3f51b5', fontWeight: 'bold' }}>
            Welcome
          </Typography>
        </Grid>
        <Grid item xs={12} sm={8}>
          <Paper
            elevation={3}
            sx={{
              padding: 3,
              display: 'flex',
              borderRadius: '12px', // Rounded corners
              backgroundColor: '#ffffff',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)', // Soft shadow effect
              minWidth : '700px'
            }}
          >
            <Grid container>
              <Grid item xs={6} display="flex" justifyContent="center" alignItems="center">
                <Avatar
                  alt={user.name}
                  src={avatarSrc} // Use the avatarSrc variable here
                  sx={{
                    width: '50%', // Responsive height based on viewport
                    height: 'auto', // Keep it square
                    maxWidth: '300px', // Max width to prevent too large
                    maxHeight: '300px', // Max height to prevent too large
                    border: '2px solid #3f51b5', // Border around the avatar
                  }}
                />
              </Grid>
              <Grid item xs={6}
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Grid container direction="column" spacing={1}>
                  <Grid item>
                    <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#333', marginBottom : '30px' }}>
                      {user.name}
                    </Typography>
                  </Grid>
                  <Grid item container>
                    <Grid item xs={3}>
                      <Typography variant="body1" sx={{ color: '#555' }}>
                        Username:
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body1" sx={{ color: '#555', fontWeight: 'bold', marginLeft: '4px' }}>
                        {user.username}
                      </Typography>
                    </Grid>
                  </Grid>
                  <Grid item container>
                    <Grid item xs={3}>
                      <Typography variant="body1" sx={{ color: '#555' }}>
                        Ngày sinh:
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body1" sx={{ color: '#555', fontWeight: 'bold', marginLeft: '4px' }}>
                        {user.birthDate}
                      </Typography>
                    </Grid>
                  </Grid>
                  <Grid item container>
                    <Grid item xs={3}>
                      <Typography variant="body1" sx={{ color: '#555' }}>
                        Địa chỉ:
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body1" sx={{ color: '#555', fontWeight: 'bold', marginLeft: '4px' }}>
                        {user.address}
                      </Typography>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Welcome;
