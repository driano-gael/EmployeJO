import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, SafeAreaView } from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import { verifyTicket } from '../services/ticketService';
import { useUser } from '../context/UserContext';
import { logout } from '../services/authService';

export default function ScanQRCodeScreen(){
  const { user, setUser } = useUser();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanning, setScanning] = useState(true);
  const [lastScanResult, setLastScanResult] = useState<string | null>(null);

  useEffect(() => {
    const getCameraPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    };

    getCameraPermissions();
  }, []);

  const handleBarcodeScanned = async ({ type, data }: { type: string; data: string }) => {
    if (!scanning) return; // Éviter les scans multiples

    setScanning(false);
    setLastScanResult(null);

    try {
      const result = await verifyTicket(data);

      if (result.valid) {
        setLastScanResult('✅ Billet valide');
        Alert.alert('✅ Succès', 'Le billet est valide !', [
          { text: 'Scanner un autre', onPress: () => setScanning(true) }
        ]);
      } else {
        setLastScanResult('❌ Billet invalide');
        Alert.alert('❌ Invalide', 'Le billet n\'est pas valide.', [
          { text: 'Scanner un autre', onPress: () => setScanning(true) }
        ]);
      }
    } catch (error: any) {
      console.error('Erreur lors de la vérification:', error);
      setLastScanResult('⚠️ Erreur de vérification');

      let errorMessage = 'Impossible de vérifier le billet.';
      if (error.response?.status === 404) {
        errorMessage = 'Billet non trouvé.';
      } else if (!error.response) {
        errorMessage = 'Problème de connexion au serveur.';
      }

      Alert.alert('⚠️ Erreur', errorMessage, [
        { text: 'Réessayer', onPress: () => setScanning(true) }
      ]);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnecter',
          onPress: async () => {
            await logout();
            setUser(null);
          }
        }
      ]
    );
  };

  const reactivateScanning = () => {
    setScanning(true);
    setLastScanResult(null);
  };

  if (hasPermission === null) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text>Demande d'autorisation pour accéder à la caméra...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>Pas d'accès à la caméra</Text>
          <Text style={styles.permissionSubtext}>
            Cette application nécessite l'accès à la caméra pour scanner les codes QR.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header avec infos utilisateur et bouton déconnexion */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Connecté en tant que:</Text>
          <Text style={styles.userInfo}>{user?.email}</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Déconnexion</Text>
        </TouchableOpacity>
      </View>

      {/* Instructions */}
      <Text style={styles.title}>Scannez le QR Code du billet</Text>

      {/* Résultat du dernier scan */}
      {lastScanResult && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultText}>{lastScanResult}</Text>
        </View>
      )}

      {/* Scanner QR Code */}
      <View style={styles.scannerContainer}>
        {scanning ? (
          <CameraView
            style={StyleSheet.absoluteFillObject}
            facing="back"
            onBarcodeScanned={handleBarcodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ["qr"],
            }}
          />
        ) : (
          <View style={styles.inactiveScanner}>
            <Text style={styles.inactiveScannerText}>Scanner désactivé</Text>
            <TouchableOpacity style={styles.reactivateButton} onPress={reactivateScanning}>
              <Text style={styles.reactivateButtonText}>Réactiver le scanner</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  permissionText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center'
  },
  permissionSubtext: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd'
  },
  welcomeText: {
    fontSize: 12,
    color: '#666'
  },
  userInfo: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333'
  },
  logoutButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold'
  },
  title: {
    fontSize: 20,
    marginVertical: 20,
    textAlign: 'center',
    color: '#333',
    fontWeight: 'bold'
  },
  resultContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007bff'
  },
  resultText: {
    fontSize: 16,
    textAlign: 'center',
    fontWeight: 'bold'
  },
  scannerContainer: {
    flex: 1,
    margin: 20,
    borderRadius: 10,
    overflow: 'hidden'
  },
  inactiveScanner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e9ecef',
    borderRadius: 10
  },
  inactiveScannerText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20
  },
  reactivateButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5
  },
  reactivateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  }
});
