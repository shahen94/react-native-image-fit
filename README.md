# react-native-switch
ImageViewer component for RN

### Installation

```sh
$ npm install --save react-native-image-fit
```
or

```sh
$ yarn add react-native-image-fit
```

### Usage

```javascript
import { ImageViewer } from 'react-native-image-fit';

export const App = () => (
  <ImageViewer
    disabled={false}
    onMove={(e, gestureState) => null}
    onPress={(opening) => console.log(opening)}
    mainImageStyle={styles.someStyle}
    zoomedImageStyle={styles.zoomedImageStyle}
    mainImageProps={{
        resizeMode: 'contain'
    }}
    zoomedImageProps={{
        resizeMode: 'contain'
    }}
  />
)
```