/**
 * Web-safe mock for @gorhom/bottom-sheet.
 * The real package depends on react-native-reanimated worklets which are unavailable on web.
 * This mock respects index/-1 visibility, onChange callbacks, and ref methods
 * so modals open/close correctly on web.
 */
const React = require('react');
const { View, StyleSheet, Pressable, Modal } = require('react-native');

const BottomSheet = React.forwardRef(function BottomSheet(props, ref) {
  const { index = -1, children, onChange, snapPoints, backdropComponent, enablePanDownToClose } = props;
  const [currentIndex, setCurrentIndex] = React.useState(index);

  React.useEffect(() => {
    setCurrentIndex(index);
  }, [index]);

  React.useImperativeHandle(ref, () => ({
    expand: () => {
      setCurrentIndex(0);
      if (onChange) onChange(0);
    },
    collapse: () => {
      setCurrentIndex(0);
      if (onChange) onChange(0);
    },
    close: () => {
      setCurrentIndex(-1);
      if (onChange) onChange(-1);
    },
    snapToIndex: (i) => {
      setCurrentIndex(i);
      if (onChange) onChange(i);
    },
    snapToPosition: () => {},
    forceClose: () => {
      setCurrentIndex(-1);
      if (onChange) onChange(-1);
    },
  }));

  const isVisible = currentIndex >= 0;
  if (!isVisible) return null;

  const handleBackdropPress = () => {
    if (enablePanDownToClose !== false) {
      setCurrentIndex(-1);
      if (onChange) onChange(-1);
    }
  };

  return React.createElement(
    Modal,
    { visible: true, transparent: true, animationType: 'slide', onRequestClose: handleBackdropPress },
    React.createElement(
      View,
      { style: styles.overlay },
      React.createElement(Pressable, { style: styles.backdrop, onPress: handleBackdropPress }),
      React.createElement(
        View,
        { style: styles.sheet },
        children
      )
    )
  );
});

const BottomSheetView = function BottomSheetView(props) {
  return React.createElement(View, { style: props.style }, props.children);
};

const BottomSheetScrollView = function BottomSheetScrollView(props) {
  const { ScrollView } = require('react-native');
  return React.createElement(ScrollView, props, props.children);
};

const BottomSheetBackdrop = function BottomSheetBackdrop() {
  return null;
};

const BottomSheetModalProvider = function BottomSheetModalProvider(props) {
  return props.children || null;
};

const BottomSheetModal = React.forwardRef(function BottomSheetModal(props, ref) {
  return React.createElement(BottomSheet, Object.assign({}, props, { ref: ref }));
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '70%',
    minHeight: 200,
    overflow: 'hidden',
  },
});

module.exports = {
  __esModule: true,
  default: BottomSheet,
  BottomSheet,
  BottomSheetView,
  BottomSheetScrollView,
  BottomSheetBackdrop,
  BottomSheetModalProvider,
  BottomSheetModal,
};
