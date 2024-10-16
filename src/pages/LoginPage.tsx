import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardBody, CardHeader, Input, Button, Tab, Tabs } from "@nextui-org/react";
import { useAuth } from '../contexts/AuthContext';

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [apiUrl, setApiUrl] = useState(import.meta.env.VITE_DEFAULT_API_URL || '');
  const { login, register, debugLogin } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('login');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!apiUrl) {
      setError('API URL is required');
      return;
    }

    try {
      new URL(apiUrl); // Validate URL
    } catch {
      setError('Invalid API URL');
      return;
    }

    try {
      if (activeTab === 'login') {
        await login(username, password, apiUrl);
      } else {
        await register(username, password);
      }
      navigate('/');
    } catch (error) {
      console.error(`${activeTab === 'login' ? 'Login' : 'Registration'} failed:`, error);
      setError(`${activeTab === 'login' ? 'Login' : 'Registration'} failed. Please check your credentials and try again.`);
    }
  };

  const handleLoginClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (e.shiftKey) {
      debugLogin();
      navigate('/');
    } else {
      handleSubmit(e);
    }
  };

  return (
    <Card className="max-w-sm mx-auto mt-10">
      <CardHeader className="flex justify-center">
        <Tabs 
          selectedKey={activeTab} 
          onSelectionChange={(key) => setActiveTab(key as string)}
        >
          <Tab key="login" title="Login" />
          <Tab key="register" title="Register" />
        </Tabs>
      </CardHeader>
      <CardBody>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="text"
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <Input
            type="password"
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Input
            type="url"
            label="API URL"
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
            required
          />
          <Button 
            type="submit" 
            color="primary" 
            className="w-full"
            onClick={handleLoginClick}
          >
            {activeTab === 'login' ? 'Login' : 'Register'}
          </Button>
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </form>
        <p className="text-center text-sm mt-2">Shift+Click for Debug Mode</p>
      </CardBody>
    </Card>
  );
}

export default LoginPage;
