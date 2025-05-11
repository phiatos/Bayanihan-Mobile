import { useFonts, Poppins_400Regular, Poppins_600SemiBold } from '@expo-google-fonts/poppins';

export default function useCustomFonts() {
  return useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
  });
}
