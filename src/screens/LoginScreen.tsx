import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { useUser } from '../context/UserContext';
import { login } from '../services/authService';

export default function LoginScreen () {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { setUser } = useUser();
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Erreur', 'Veuillez saisir votre email et mot de passe.');
      return;
    }

    setLoading(true);
    try {
      const { access, role, email: userEmail } = await login(email, password);

      if (role !== 'employe') {
        Alert.alert('Accès refusé', 'Seuls les employés peuvent se connecter à cette application.');
        setLoading(false);
        return;
      }

      // Mettre à jour le contexte utilisateur
      setUser({
        token: access,
        email: userEmail,
        role
      });

    } catch (error: any) {
      console.error('Erreur de connexion:', error);

      let errorMessage = 'Erreur de connexion. Veuillez réessayer.';

      if (error.response?.status === 400) {
        errorMessage = 'Email ou mot de passe incorrect.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Identifiants invalides.';
      } else if (!error.response) {
        errorMessage = 'Impossible de se connecter au serveur. Vérifiez votre connexion internet.';
      }

      Alert.alert('Erreur', errorMessage);
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Connexion Employé</Text>
      <Text style={styles.subtitle}>Application de vérification des billets</Text>

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
      />

      <TextInput
        placeholder="Mot de passe"
        value={password}
        onChangeText={setPassword}
        style={styles.input}
        secureTextEntry
        autoComplete="password"
      />

      <Button
        title={loading ? 'Connexion...' : 'Se connecter'}
        onPress={handleLogin}
        disabled={loading}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5'
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: '#333'
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 30,
    textAlign: 'center',
    color: '#666'
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 15,
    padding: 15,
    borderRadius: 8,
    backgroundColor: '#fff',
    fontSize: 16
  },
});
