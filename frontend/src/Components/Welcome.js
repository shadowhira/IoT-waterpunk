import React from 'react';
import { Grid, Paper, Typography, Avatar, Box, useMediaQuery, useTheme } from '@mui/material';
import defaultAvatar from '../Assets/Images/defaultAvatar.png'; // Adjust the path as necessary
import { MARGIN_HEADING } from '../Assets/Constants/constants';

function Welcome({ user }) {
  const avatarSrc = user.avatar || defaultAvatar; // Use user's avatar or default image
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%', // Height of the main container
        marginTop: MARGIN_HEADING/8,
        width: '100%',
        overflow: 'hidden' // Prevent horizontal scrolling
      }}
    >
      <Grid container spacing={2} justifyContent="center" alignItems="center">
        <Grid item xs={12}>
          <Typography
            variant={isMobile ? "h3" : "h1"}
            align="center"
            gutterBottom
            sx={{
              color: '#3f51b5',
              fontWeight: 'bold',
              fontSize: { xs: '2rem', sm: '3rem', md: '3.75rem' } // Responsive font size
            }}
          >
            Welcome
          </Typography>
        </Grid>
        <Grid item xs={12} sm={10} md={8}>
          <Paper
            elevation={3}
            sx={{
              padding: { xs: 2, sm: 3 },
              display: 'flex',
              borderRadius: '12px', // Rounded corners
              backgroundColor: '#ffffff',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)', // Soft shadow effect
              width: '100%',
              maxWidth: { xs: '100%', sm: '100%', md: '800px' },
              margin: '0 auto'
            }}
          >
            <Grid container>
              <Grid item xs={12} sm={6} display="flex" justifyContent="center" alignItems="center" sx={{ mb: { xs: 3, sm: 0 } }}>
                <Avatar
                  alt={user.name}
                  src={avatarSrc} // Use the avatarSrc variable here
                  sx={{
                    width: { xs: '40%', sm: '50%' }, // Responsive width
                    height: 'auto', // Keep it square
                    maxWidth: { xs: '150px', sm: '200px', md: '300px' }, // Responsive max width
                    maxHeight: { xs: '150px', sm: '200px', md: '300px' }, // Responsive max height
                    border: '2px solid #3f51b5', // Border around the avatar
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: { xs: 'flex-start', sm: 'center' },
                  paddingLeft: { xs: 2, sm: 0 }
                }}
              >
                <Grid container direction="column" spacing={1}>
                  <Grid item>
                    <Typography
                      variant={isMobile ? "h4" : "h3"}
                      sx={{
                        fontWeight: 'bold',
                        color: '#333',
                        marginBottom: { xs: '15px', sm: '30px' },
                        fontSize: { xs: '1.5rem', sm: '2rem', md: '3rem' },
                        textAlign: { xs: 'center', sm: 'left' }
                      }}
                    >
                      {user.name}
                    </Typography>
                  </Grid>
                  <Grid item container>
                    <Grid item xs={4} sm={3}>
                      <Typography variant="body1" sx={{ color: '#555', fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                        Username:
                      </Typography>
                    </Grid>
                    <Grid item xs={8} sm={9}>
                      <Typography variant="body1" sx={{ color: '#555', fontWeight: 'bold', marginLeft: '4px', fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                        {user.username}
                      </Typography>
                    </Grid>
                  </Grid>
                  <Grid item container>
                    <Grid item xs={4} sm={3}>
                      <Typography variant="body1" sx={{ color: '#555', fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                        Ngày sinh:
                      </Typography>
                    </Grid>
                    <Grid item xs={8} sm={9}>
                      <Typography variant="body1" sx={{ color: '#555', fontWeight: 'bold', marginLeft: '4px', fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                        {user.birthDate}
                      </Typography>
                    </Grid>
                  </Grid>
                  <Grid item container>
                    <Grid item xs={4} sm={3}>
                      <Typography variant="body1" sx={{ color: '#555', fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                        Địa chỉ:
                      </Typography>
                    </Grid>
                    <Grid item xs={8} sm={9}>
                      <Typography variant="body1" sx={{ color: '#555', fontWeight: 'bold', marginLeft: '4px', fontSize: { xs: '0.875rem', sm: '1rem' } }}>
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
