import { useRouter } from "expo-router";
import * as SystemUI from "expo-system-ui";
import React from "react";
import { Image, StyleSheet, View } from "react-native";
import { colors } from "../constants/theme";

// Set navigation bar to transparent
SystemUI.setBackgroundColorAsync("transparent");

const Index = () => {
  const router = useRouter();

  // useEffect(() => {
  //   setTimeout(() => {
  //     router.push("/(auth)/welcome");
  //   }, 2000);
  // }, []);
  return (
    <View style={styles.container}>
      <Image
        style={styles.logo}
        resizeMode="contain"
        source={require("../assets/images/splashImage.png")}
      />
    </View>
  );
};

export default Index;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.neutral900,
  },
  logo: {
    height: "20%",
    aspectRatio: 1,
  },
});
