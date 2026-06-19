import { View, Text, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { router } from 'expo-router';
import { useExperience } from '@/store/experience';
import { aed } from '@/lib/format';

/** Map — listings plotted by lat/lng; tap a pin to open the detail. */
export default function MapScreen() {
  const { listings } = useExperience();
  const insets = useSafeAreaInsets();
  const withCoords = listings.filter((l) => l.latitude != null && l.longitude != null);

  return (
    <View className="flex-1 bg-fog">
      <MapView
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        style={{ flex: 1 }}
        initialRegion={{ latitude: 25.08, longitude: 55.14, latitudeDelta: 0.2, longitudeDelta: 0.2 }}
      >
        {withCoords.map((l) => (
          <Marker
            key={l.reference}
            coordinate={{ latitude: l.latitude as number, longitude: l.longitude as number }}
            title={l.community ?? l.title}
            description={aed(l.priceAed)}
            onCalloutPress={() => router.push(`/property/${l.reference}`)}
          />
        ))}
      </MapView>
      <View pointerEvents="none" style={{ position: 'absolute', top: insets.top + 6, left: 20 }}>
        <Text className="text-lg font-bold text-ink">Map</Text>
      </View>
    </View>
  );
}
