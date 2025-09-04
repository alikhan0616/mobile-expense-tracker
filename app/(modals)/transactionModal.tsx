import BackButton from "@/components/BackButton";
import Button from "@/components/Button";
import Header from "@/components/Header";
import ImageUplaod from "@/components/ImageUplaod";
import Input from "@/components/Input";
import ModalWrapper from "@/components/ModalWrapper";
import Typo from "@/components/Typo";
import { expenseCategories, transactionTypes } from "@/constants/data";
import { colors, radius, spacingX, spacingY } from "@/constants/theme";
import { useAuth } from "@/contexts/authContext";
import useFetchData from "@/hooks/useFetchData";
import {
  createOrUpdateTransaction,
  deleteTransaction,
} from "@/services/transactionService";
import { TransactionType, WalletType } from "@/types";
import { scale, verticalScale } from "@/utils/styling";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { orderBy, where } from "firebase/firestore";
import * as Icons from "phosphor-react-native";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Dropdown } from "react-native-element-dropdown";
const TransactionModal = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [transaction, setTransaction] = useState<TransactionType>({
    type: "expense",
    amount: 0,
    description: "",
    category: "",
    date: new Date(),
    walletId: "",
    image: null,
  });
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const {
    data: wallets,
    error: walletError,
    loading: walletLoading,
  } = useFetchData<WalletType>("wallets", [
    where("uid", "==", user?.uid),
    orderBy("created", "desc"),
  ]);

  const onDateChange = (event: any, selectedDate: any) => {
    const currentDate = selectedDate || transaction.date;
    setTransaction({ ...transaction, date: currentDate });
    setShowDatePicker(Platform.OS === "ios" ? true : false);
  };

  type paramType = {
    id: string;
    type: string;
    amount: string;
    description?: string;
    date: string;
    category?: string;
    image?: any;
    uid?: string;
    walletId: string;
  };
  const oldTransaction: paramType = useLocalSearchParams();

  useEffect(() => {
    if (oldTransaction?.id) {
      setTransaction({
        type: oldTransaction?.type,
        category: oldTransaction?.category || "",
        amount: Number(oldTransaction.amount),
        description: oldTransaction.description || "",
        image: oldTransaction?.image,
        date: new Date(oldTransaction.date),
        walletId: oldTransaction.walletId,
      });
    }
  }, []);

  const onSubmit = async () => {
    const { type, amount, description, category, date, walletId, image } =
      transaction;

    if (!walletId || !date || !amount || (type === "expense" && !category)) {
      Alert.alert("Transaction", "Please fill all the fields!");
      return;
    }

    let transactionData: TransactionType = {
      type,
      amount,
      date,
      description,
      category,
      walletId,
      image: image ? image : null,
      uid: user?.uid,
    };

    if (oldTransaction?.id) transactionData.id = oldTransaction.id;
    setLoading(true);
    const res = await createOrUpdateTransaction(transactionData);
    setLoading(false);
    if (res.success) {
      router.back();
    } else {
      Alert.alert("Transaction", res.msg);
    }
  };

  const onDelete = async () => {
    if (!oldTransaction?.id) {
      return;
    }
    setLoading(true);
    const res = await deleteTransaction(
      oldTransaction?.id,
      oldTransaction?.walletId
    );
    setLoading(false);
    if (res.success) {
      router.back();
    } else {
      Alert.alert("Transaction", res.msg);
    }
  };

  const showDeleteAlert = () => {
    Alert.alert(
      "Confirm",
      "Are you sure you want to delete this transaction?",
      [
        {
          text: "Cancel",
          onPress: () => console.log("Cancel delete"),
          style: "cancel",
        },
        { text: "Delete", onPress: () => onDelete(), style: "destructive" },
      ]
    );
  };

  return (
    <ModalWrapper>
      <View style={styles.container}>
        <Header
          title={oldTransaction?.id ? "Update Transaction" : "New Transaction"}
          leftIcon={<BackButton />}
          style={{ marginBottom: spacingY._10 }}
        />

        {/* Form */}
        <ScrollView
          contentContainerStyle={styles.form}
          showsVerticalScrollIndicator={false}
        >
          {/* Type Drop Down */}
          <View style={styles.inputContainer}>
            <Typo color={colors.neutral200} size={16}>
              Type
            </Typo>
            {/* Drop Down */}
            <Dropdown
              style={styles.dropdownContainer}
              activeColor={colors.neutral700}
              //   placeholderStyle={styles.dropdownPlaceholder}
              selectedTextStyle={styles.dropdownSelectedText}
              iconStyle={styles.dropdownIcon}
              data={transactionTypes}
              maxHeight={300}
              labelField="label"
              valueField="value"
              itemTextStyle={styles.dropdownItemText}
              itemContainerStyle={styles.dropdownItemContainer}
              containerStyle={styles.dropdownListContainer}
              //   placeholder={!isFocus ? "Select item" : "..."}
              //   searchPlaceholder="Search..."
              value={transaction.type}
              onChange={(item) => {
                setTransaction({ ...transaction, type: item.value });
              }}
            />
          </View>

          {/* Wallets Drop Down */}
          <View style={styles.inputContainer}>
            <Typo color={colors.neutral200} size={16}>
              Wallet
            </Typo>
            {/* Drop Down */}
            <Dropdown
              style={styles.dropdownContainer}
              activeColor={colors.neutral700}
              placeholderStyle={styles.dropdownPlaceholder}
              selectedTextStyle={styles.dropdownSelectedText}
              iconStyle={styles.dropdownIcon}
              data={wallets.map((wallet) => ({
                label: `${wallet?.name} (PKR${wallet.amount})`,
                value: wallet?.id,
              }))}
              maxHeight={300}
              labelField="label"
              valueField="value"
              itemTextStyle={styles.dropdownItemText}
              itemContainerStyle={styles.dropdownItemContainer}
              containerStyle={styles.dropdownListContainer}
              placeholder={"Select wallet"}
              //   searchPlaceholder="Search..."
              value={transaction.walletId}
              onChange={(item) => {
                setTransaction({ ...transaction, walletId: item.value });
              }}
            />
          </View>

          {/* Expense Categories Drop Down */}
          {transaction.type === "expense" && (
            <View style={styles.inputContainer}>
              <Typo color={colors.neutral200} size={16}>
                Category
              </Typo>
              {/* Drop Down */}
              <Dropdown
                style={styles.dropdownContainer}
                activeColor={colors.neutral700}
                placeholderStyle={styles.dropdownPlaceholder}
                selectedTextStyle={styles.dropdownSelectedText}
                iconStyle={styles.dropdownIcon}
                data={Object.values(expenseCategories)}
                maxHeight={300}
                labelField="label"
                valueField="value"
                itemTextStyle={styles.dropdownItemText}
                itemContainerStyle={styles.dropdownItemContainer}
                containerStyle={styles.dropdownListContainer}
                placeholder={"Select categroy"}
                //   searchPlaceholder="Search..."
                value={transaction.category}
                onChange={(item) => {
                  setTransaction({ ...transaction, category: item.value });
                }}
              />
            </View>
          )}

          {/* Date Picker */}
          <View style={styles.inputContainer}>
            <Typo color={colors.neutral200} size={16}>
              Date
            </Typo>
            {!showDatePicker && (
              <Pressable
                style={styles.dateInput}
                onPress={() => setShowDatePicker(true)}
              >
                <Typo size={14}>
                  {(transaction.date as Date).toLocaleDateString()}
                </Typo>
              </Pressable>
            )}

            {showDatePicker && (
              <View style={Platform.OS === "ios" && styles.iosDatePicker}>
                <DateTimePicker
                  themeVariant="dark"
                  value={transaction.date as Date}
                  textColor={colors.white}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={onDateChange}
                />
                {Platform.OS === "ios" && (
                  <TouchableOpacity
                    style={styles.datePickerButton}
                    onPress={() => setShowDatePicker(false)}
                  >
                    <Typo fontWeight={"500"} size={15}>
                      Ok
                    </Typo>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          {/* Set Amount */}
          <View style={styles.inputContainer}>
            <Typo color={colors.neutral200} size={16}>
              Amount
            </Typo>
            <Input
              //   placeholder="Slary"
              value={transaction.amount.toString()}
              keyboardType="numeric"
              onChangeText={(value) => {
                setTransaction({
                  ...transaction,
                  amount: Number(value.replace(/[^0-9]/g, "")),
                });
              }}
            />
          </View>
          {/* Description */}
          <View style={styles.inputContainer}>
            <View style={styles.flexRow}>
              <Typo color={colors.neutral200} size={16}>
                Description
              </Typo>
              <Typo color={colors.neutral500} size={14}>
                (optional)
              </Typo>
            </View>
            <Input
              multiline
              containerStyle={{
                flexDirection: "row",
                height: verticalScale(100),
                alignItems: "flex-start",
                paddingVertical: 15,
              }}
              value={transaction.description}
              placeholder="Bought an apple..."
              onChangeText={(value) => {
                setTransaction({
                  ...transaction,
                  description: value,
                });
              }}
            />
          </View>
          <View style={styles.inputContainer}>
            <View style={styles.flexRow}>
              <Typo color={colors.neutral200} size={16}>
                Receipt
              </Typo>
              <Typo color={colors.neutral500} size={14}>
                (optional)
              </Typo>
            </View>
            {/* Image Input */}
            <ImageUplaod
              file={transaction.image}
              onClear={() => setTransaction({ ...transaction, image: null })}
              onSelect={(file) =>
                setTransaction({ ...transaction, image: file })
              }
              placeholder="Upload Image"
            />
          </View>
        </ScrollView>
      </View>
      <View style={styles.footer}>
        {oldTransaction?.id && !loading && (
          <Button
            onPress={showDeleteAlert}
            style={{
              backgroundColor: colors.rose,
              paddingHorizontal: spacingX._15,
            }}
          >
            <Icons.TrashIcon
              color={colors.white}
              size={verticalScale(24)}
              weight="bold"
            />
          </Button>
        )}
        <Button loading={loading} onPress={onSubmit} style={{ flex: 1 }}>
          <Typo color={colors.black} fontWeight={"700"}>
            {oldTransaction?.id ? "Update" : "Submit"}
          </Typo>
        </Button>
      </View>
    </ModalWrapper>
  );
};

export default TransactionModal;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacingY._20,
  },
  // self added
  label: {
    fontSize: verticalScale(14),
    color: colors.neutral200,
    marginBottom: spacingY._5,
  },
  form: {
    gap: spacingY._20,
    paddingVertical: spacingY._15,
    paddingBottom: spacingY._40,
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
  inputContainer: {
    gap: spacingY._10,
  },
  iosDropDown: {
    flexDirection: "row",
    height: verticalScale(54),
    alignItems: "center",
    justifyContent: "center",
    fontSize: verticalScale(14),
    borderWidth: 1,
    color: colors.white,
    borderColor: colors.neutral300,
    borderRadius: radius._17,
    borderCurve: "continuous",
    paddingHorizontal: spacingX._15,
  },
  androidDropDown: {
    // flexDirection: "row"
    height: verticalScale(54),
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    fontSize: verticalScale(14),
    color: colors.white,
    borderColor: colors.neutral300,
    borderRadius: radius._17,
    borderCurve: "continuous",
    // paddingHorizontal: spacingX._15,
  },
  flexRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacingX._5,
  },
  dateInput: {
    flexDirection: "row",
    height: verticalScale(54),
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.neutral300,
    borderRadius: radius._17,
    borderCurve: "continuous",
    paddingHorizontal: spacingX._15,
  },
  iosDatePicker: {
    // backgroundColor: "red",
  },
  datePickerButton: {
    backgroundColor: colors.neutral700,
    alignSelf: "flex-end",
    padding: spacingY._7,
    marginRight: spacingX._7,
    paddingHorizontal: spacingY._15,
    borderRadius: radius._10,
  },
  dropdownContainer: {
    height: verticalScale(54),
    borderWidth: 1,
    borderColor: colors.neutral300,
    paddingHorizontal: spacingX._15,
    borderRadius: radius._15,
    borderCurve: "continuous",
  },
  dropdownItemText: { color: colors.white },
  dropdownSelectedText: {
    color: colors.white,
    fontSize: verticalScale(14),
  },
  dropdownListContainer: {
    backgroundColor: colors.neutral900,
    borderRadius: radius._15,
    borderCurve: "continuous",
    paddingVertical: spacingY._7,
    top: 5,
    borderColor: colors.neutral500,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 5,
  },
  dropdownPlaceholder: {
    color: colors.white,
  },
  dropdownItemContainer: {
    borderRadius: radius._15,
    marginHorizontal: spacingX._7,
  },
  dropdownIcon: {
    height: verticalScale(30),
    tintColor: colors.neutral300,
  },
});
