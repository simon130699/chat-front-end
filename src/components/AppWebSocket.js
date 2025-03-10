import React, { useState, useEffect } from 'react';
import * as SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { Box, Button, TextField, Typography, Paper } from '@mui/material';

function WebSocketDemo() {
  const [stompClient, setStompClient] = useState(null);
  const [connected, setConnected] = useState(false);
  const [message, setMessage] = useState('');
  const [receivedMessages, setReceivedMessages] = useState([]);
  const [username, setUsername] = useState('');
  const [roomId, setRoomId] = useState('general');

  // Conectar al WebSocket
  const connect = () => {
    if (!username.trim()) {
      alert('Por favor ingresa un nombre de usuario');
      return;
    }

    const client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:3000/ws'),
      onConnect: () => {
        setConnected(true);
        
        // Suscribirse al topic con el roomId
        client.subscribe(`/topic/${roomId}`, message => {
          try {
            const receivedMessage = JSON.parse(message.body);
            setReceivedMessages(prev => [...prev, receivedMessage]);
          } catch (e) {
            console.error('Error al parsear el mensaje:', e);
          }
        });
      },
      onStompError: (frame) => {
        console.error('Error en STOMP:', frame);
      },
      debug: function (str) {
        console.log('STOMP: ' + str);
      }
    });

    client.activate();
    setStompClient(client);
  };

  // Desconectar del WebSocket
  const disconnect = () => {
    if (stompClient) {
      stompClient.deactivate();
      setConnected(false);
      setReceivedMessages([]);
    }
  };

  // Enviar un mensaje
  const sendMessage = () => {
    if (stompClient && message && stompClient.connected) {
      stompClient.publish({
        destination: `/app/chat/${roomId}`,
        body: JSON.stringify({ 
          message: message,
          user: username 
        })
      });
      setMessage('');
    }
  };

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', p: 2 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Chat en tiempo real
        </Typography>
        
        {!connected ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Nombre de usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              fullWidth
              margin="normal"
              required
            />
            <TextField
              label="Sala (roomId)"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              fullWidth
              margin="normal"
              helperText="Deja 'general' o especifica otra sala para unirte"
            />
            <Button variant="contained" onClick={connect} disabled={!username.trim()}>
              Conectar al chat
            </Button>
          </Box>
        ) : (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography>
                Conectado como: <strong>{username}</strong> en sala: <strong>{roomId}</strong>
              </Typography>
              <Button variant="outlined" color="error" onClick={disconnect}>
                Desconectar
              </Button>
            </Box>
            
            <Box sx={{ mt: 3 }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  label="Mensaje"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                />
                <Button variant="contained" onClick={sendMessage}>
                  Enviar
                </Button>
              </Box>
              
              <Box sx={{ mt: 3, maxHeight: '300px', overflow: 'auto' }}>
                <Typography variant="h6">Mensajes:</Typography>
                {receivedMessages.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No hay mensajes aún
                  </Typography>
                ) : (
                  receivedMessages.map((msg, index) => (
                    <Paper 
                      key={index} 
                      sx={{ 
                        p: 1, 
                        mt: 1, 
                        backgroundColor: msg.user === username ? '#e3f2fd' : '#f5f5f5',
                        ml: msg.user === username ? 'auto' : 0,
                        mr: msg.user === username ? 0 : 'auto',
                        maxWidth: '80%'
                      }}
                    >
                      <Typography variant="subtitle2" color="primary">{msg.user}</Typography>
                      <Typography>{msg.message}</Typography>
                    </Paper>
                  ))
                )}
              </Box>
            </Box>
          </>
        )}
      </Paper>
    </Box>
  );
}

export default WebSocketDemo;