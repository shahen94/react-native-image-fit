'use strict';

import React, { Component, PropTypes } from 'react';

import {
  StyleSheet,
  View,
  Image,
  Animated,
  PanResponder,
  Dimensions,
  TouchableWithoutFeedback,
  Modal,
  InteractionManager
} from 'react-native';
import { backgroundValueCalculation } from './utils';

const AnimatedImage = Animated.createAnimatedComponent(Image);
const { width, height } = Dimensions.get('window');

const LAYOUT_ENUM = {
  X: 'x',
  Y: 'y'
};

const BACKGROUND_VALUES = {
  MAX: 100,
  MIN: 0
};

const DOUBLE_TAP_MILISECONDS = 200;

export class ImageViewer extends Component {
  static propTypes = {
    // common
    source: Image.propTypes.source,
    disabled: PropTypes.bool,
    doubleTapEnabled: PropTypes.bool,
    // main image
    mainImageStyle: Image.propTypes.style,
    mainImageProps: PropTypes.object,
    // zoomed image
    zoomedImageStyle: Image.propTypes.style,
    zoomedImageProps: PropTypes.object,

    // required if it's a local image
    imageWidth: PropTypes.number,
    imageHeight: PropTypes.number,

    // callbacks
    onMove: PropTypes.func,
    onPress: PropTypes.func,
    onClose: PropTypes.func,

    // back button
    closeOnBack: PropTypes.bool,
  };

  static defaultProps = {
    doubleTapEnabled: true,
    imageWidth: width,
    imageHeight: height / 2,
    closeOnBack: true
  };

  constructor(props, context) {
    super(props, context);

    this.state = {
      openModal: false,
      scale: new Animated.Value(1),
      layout: new Animated.ValueXY({ x: 0, y: 0 }),
      backgroundOpacity: new Animated.Value(BACKGROUND_VALUES.MIN),
      mainImageOpacity: new Animated.Value(1)
    };

    this.panResponder = null;
    this.layoutListener = null;

    this._imageSize = {
      width: typeof props.source !== 'object' ? props.imageWidth : null,
      height: typeof props.source !== 'object' ? props.imageHeight : null,
    };

    this._layoutX = 0;
    this._layoutY = 0;
    this._lastMovedX = 0;
    this._lastMovedY = 0;
    this._modalClosing = 0;
    this._doubleTapTimeout = null;
    this._isScaled = false;
    this._isAnimatingToCenter = false;
    this._zoomedImageSize = {
      width: null,
      height: null
    };

    this.handleMove = this.handleMove.bind(this);
    this.handleRelease = this.handleRelease.bind(this);
    this.toggleModal = this.toggleModal.bind(this);
    this.handleSetPanResponder = this.handleSetPanResponder.bind(this);
    this.handleLayoutChange = this.handleLayoutChange.bind(this);
  }

  componentWillMount() {
    const { source } = this.props;

    this.state.layout.x.addListener((animated) => this.handleLayoutChange(animated, LAYOUT_ENUM.X));
    this.state.layout.y.addListener((animated) => this.handleLayoutChange(animated, LAYOUT_ENUM.Y));

    this.panResponder = PanResponder.create({
      onStartShouldSetPanResponder: this.handleSetPanResponder,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: this.handleMove,
      onPanResponderRelease: this.handleRelease,
      onPanResponderTerminate: this.handleRelease
    });

    if (typeof source === 'object' && typeof source.uri === 'string') {
      Image.prefetch(source.uri);
      Image.getSize(source.uri, (width, height) => {
        this._imageSize = { width, height };
      });
    }
  }
  componentWillUnmount() {
    this.state.layout.x.removeAllListeners();
    this.state.layout.y.removeAllListeners();
  }
  handleMove(e, gestureState) {
    if (typeof this.props.onMove === 'function') {
      this.props.onMove(e, gestureState);
    }

    const currentScaleSizes = {
      width: this._zoomedImageSize.width * 2,
      height: this._zoomedImageSize.height * 2
    };

    const modifiedGestureState = Object.assign({}, gestureState, {
      dx: this._lastMovedX + gestureState.dx,
      dy: this._lastMovedY + gestureState.dy
    });

    Animated.event([null, {
      dx: this.state.layout.x,
      dy: this.state.layout.y
    }])(e, modifiedGestureState);
  }

  handleLayoutChange(animated, axis) {
    switch(axis) {
      case LAYOUT_ENUM.X:
        this._layoutX = animated.value;
        break;
      case LAYOUT_ENUM.Y:
        this._layoutY = animated.value;
        break;
    }

    if (this._modalClosing || this._isScaled || this._isAnimatingToCenter) {
      return;
    }

    const value = backgroundValueCalculation(this._layoutY, this._layoutX, BACKGROUND_VALUES);

    Animated.timing(this.state.backgroundOpacity, {
      toValue: value,
      duration: 1
    }).start();
  }

  handleSetPanResponder() {
    const currMil = Date.now();

    if (!!this._doubleTapTimeout &&
        (currMil - this._doubleTapTimeout <= DOUBLE_TAP_MILISECONDS) &&
        this.props.doubleTapEnabled
      ) {
      const value = this._isScaled ? 1 : 2;
      this._isAnimatingToCenter = this._isScaled;
      this._isScaled = !this._isScaled;

      Animated.timing(this.state.scale, {
        toValue: value,
        duration: 100
      }).start(() => {
        this._isAnimatingToCenter = false;
        if (!this._isScaled) {
          this._lastMovedY = 0;
          this._lastMovedX = 0;
        }
      });
    }
    this._doubleTapTimeout = currMil;

    return true;
  }

  handleRelease() {
    const value = backgroundValueCalculation(this._layoutY, this._layoutX, BACKGROUND_VALUES);
    const resetAnimation = Animated.timing(this.state.layout, {
      toValue: { x: 0, y: 0 },
      duration: 150
    });

    if (this._isScaled) {
      this._lastMovedY = this._layoutY;
      this._lastMovedX = this._layoutX;
      return;
    }

    const resetBackgroundAnimation = Animated.timing(this.state.backgroundOpacity, {
      toValue: BACKGROUND_VALUES.MAX,
      duration: 150
    });

    const cleanBackgroundAnimation = Animated.sequence([
      Animated.timing(this.state.backgroundOpacity, {
        toValue: BACKGROUND_VALUES.MIN,
        duration: 150
      }),
      Animated.timing(this.state.mainImageOpacity, {
        toValue: 1,
        duration: 50
      })
    ]);

    const animations = [];
    animations.push(resetAnimation);

    const shouldCloseModal = value <= 0;

    if (!this._isAnimatingToCenter && shouldCloseModal) {
      this._modalClosing = true;
      animations.push(cleanBackgroundAnimation);
    }

    animations.forEach(animation => animation.start());
    if (!this._isAnimatingToCenter && shouldCloseModal) {
      InteractionManager.runAfterInteractions(() => this.toggleModal());
    }
  }

  toggleModal() {
    const shouldOpen = !this.state.openModal;

    if (this.props.disabled) {
      return;
    }
    if (typeof this.props.onPress === 'function') {
      this.props.onPress(shouldOpen);
    }
    if (shouldOpen) {
      this._modalClosing = false;
      this.state.backgroundOpacity.setValue(BACKGROUND_VALUES.MAX);
    } else {
      this.state.backgroundOpacity.setValue(BACKGROUND_VALUES.MIN);
      // call prop
      if(typeof this.props.onClose === 'function'){
        this.props.onClose()
      }
    }
    this.state.mainImageOpacity.setValue(shouldOpen ? 0 : 1);
    this.setState({
      openModal: shouldOpen
    });
  }

  render() {
    const {
      source,
      mainImageStyle,
      mainImageProps,
      zoomedImageStyle,
      zoomedImageProps
    } = this.props;

    const {
      backgroundOpacity,
      openModal,
      scale
    } = this.state;

    if (this._imageSize.width / width > this._imageSize.height / height) {
      this._zoomedImageSize.width = width;
      this._zoomedImageSize.height = width / this._imageSize.width * this._imageSize.height
    } else {
      this._zoomedImageSize.height = height;
      this._zoomedImageSize.width = height / this._imageSize.width * this._imageSize.height;
    }

    const interpolatedColor = backgroundOpacity.interpolate({
      inputRange: [BACKGROUND_VALUES.MIN, BACKGROUND_VALUES.MAX],
      outputRange: ['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 1)']
    })

    return (
      <Animated.View>
        <TouchableWithoutFeedback
          onPress={this.toggleModal}
        >
          <AnimatedImage
            source={source}
            style={[
              styles.image,
              mainImageStyle,
              { opacity: this.state.mainImageOpacity }
            ]}
            resizeMode={'contain'}
            {...mainImageProps}
          />
        </TouchableWithoutFeedback>
        <Modal
          animationType="fade"
          visible={openModal}
          onRequestClose={this.props.closeOnBack ? this.toggleModal : () => null}
          transparent={true}
        >
          <Animated.View
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: interpolatedColor
            }}
          >
            <AnimatedImage
              source={source}
              {...this.panResponder.panHandlers}
              style={[
                this._zoomedImageSize,
                zoomedImageStyle,
                {
                  transform: [
                    ...this.state.layout.getTranslateTransform(),
                    { scale }
                  ]
                }
              ]}
              {...zoomedImageProps}
            />
          </Animated.View>
        </Modal>
      </Animated.View>
    );
  }
}

const styles = StyleSheet.create({
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    width,
    height,
    bottom: 0,
  },
  image: {
    width: 200,
    height: 200,
  }
});
