# react-native-image-fit
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

### ImageViewer Component example

![ezgif-3352117320](https://cloud.githubusercontent.com/assets/13334788/19832054/dc83a9f4-9e2a-11e6-9023-ccd80fb944b5.gif)
