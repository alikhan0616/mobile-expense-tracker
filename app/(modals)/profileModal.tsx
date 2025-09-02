import BackButton from "@/components/BackButton";
import Button from "@/components/Button";
import Header from "@/components/Header";
import Input from "@/components/Input";
import ModalWrapper from "@/components/ModalWrapper";
import Typo from "@/components/Typo";
import { colors, spacingX, spacingY } from "@/constants/theme";
import { useAuth } from "@/contexts/authContext";
import { getProfileImage } from "@/services/imageService";
import { updateUser } from "@/services/userService";
import { UserDataType } from "@/types";
import { scale, verticalScale } from "@/utils/styling";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import * as Icons from "phosphor-react-native";
import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
const ProfileModal = () => {
  const { user, updateUserData } = useAuth();
  const router = useRouter();
  const [userData, setUserData] = useState<UserDataType>({
    name: "",
    image: null,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setUserData({
      name: user?.name || "",
      image: user?.image || null,
    });
  }, [user]);

  const onSubmit = async () => {
    let { name, image } = userData;
    if (!name.trim()) {
      Alert.alert("User", "Name field can't be empty");
      return;
    }

    setLoading(true);
    const res = await updateUser(user?.uid as string, userData);
    setLoading(false);
    if (res.success) {
      // Update User
      updateUserData(user?.uid as string);
      router.back();
    } else {
      Alert.alert("User", res.msg);
    }
  };

  const onPickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      // allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
    });

    console.log(result);

    if (!result.canceled) {
      setUserData({ ...userData, image: result.assets[0] });
    }
  };
  return (
    <ModalWrapper>
      <View style={styles.container}>
        <Header
          title="Update Profile"
          leftIcon={<BackButton />}
          style={{ marginBottom: spacingY._10 }}
        />

        {/* Form */}
        <ScrollView contentContainerStyle={styles.form}>
          <View style={styles.avatarContainer}>
            <Image
              style={styles.avatar}
              source={getProfileImage(userData.image)}
              contentFit="cover"
              transition={100}
            />

            <TouchableOpacity onPress={onPickImage} style={styles.editIcon}>
              <Icons.PencilIcon
                size={verticalScale(20)}
                color={colors.neutral800}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <Typo color={colors.neutral200}>Name</Typo>
            <Input
              placeholder="Name"
              value={userData.name}
              onChangeText={(value) => {
                setUserData({ ...userData, name: value });
              }}
            />
          </View>
        </ScrollView>
      </View>
      <View style={styles.footer}>
        <Button loading={loading} onPress={onSubmit} style={{ flex: 1 }}>
          <Typo color={colors.black} fontWeight={"700"}>
            Update
          </Typo>
        </Button>
      </View>
    </ModalWrapper>
  );
};

export default ProfileModal;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacingX._20,
    justifyContent: "space-between",
  },
  footer: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    paddingHorizontal: spacingX._20,
    gap: scale(12),
    paddingTop: spacingY._15,
    borderTopColor: colors.neutral700,
    marginBottom: spacingY._5,
    borderTopWidth: 1,
  },
  form: {
    gap: spacingY._30,
    marginTop: spacingY._15,
  },
  avatarContainer: {
    position: "relative",
    alignSelf: "center",
  },
  avatar: {
    alignSelf: "center",
    backgroundColor: colors.neutral300,
    height: verticalScale(135),
    width: verticalScale(135),
    borderRadius: 200,
    borderWidth: 1,
    borderColor: colors.neutral500,
  },
  editIcon: {
    position: "absolute",
    bottom: spacingY._5,
    right: spacingY._7,
    borderRadius: 100,
    backgroundColor: colors.neutral100,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
    padding: spacingY._7,
  },
  inputContainer: {
    gap: spacingY._10,
  },
});
