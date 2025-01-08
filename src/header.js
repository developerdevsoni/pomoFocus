import React, {Component} from 'react';
import {
  Animated,
  Dimensions,
  Image,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import styles from './styles';
import {
  Menu,
  MenuOptions,
  MenuOption,
  MenuTrigger,
} from 'react-native-popup-menu';

export default class Header extends Component {
  constructor(props) {
    super(props);

    this.state = {
      activeIndex: {current: 0, previous: null},
    };
    this.scale = new Animated.Value(1);
  }
  
  onScroll = e => {
    console.log('calling');

    const x = this.props.backgroundColor;
    let newIndex = x == 'Pomodoro' ? 1 : x == 'Short_Break' ? 2 : 3;
    if (this.state.activeIndex.current !== newIndex) {
      this.setState({
        activeIndex: {
          current: newIndex,
          previous: this.state.activeIndex.current,
        },
      });
    } else {
      this.setState({
        current: 0,
        previous: null,
      });
    }
  };

  render() {
    const data = ['#C25C5C', '#4E9196', '#4F7FA2'];
    const {width, height} = Dimensions.get('window');
    return (
      <View
        style={[
          styles.headerContainer,
          {
            backgroundColor:
              this.props.backgroundColor == 'Pomodoro'
                ? '#BA4849'
                : this.props.backgroundColor == 'Short_Break'
                ? '#38848A'
                : '#397097',
            marginTop: Platform.OS == 'ios' ? 52 : 0,
          },
        ]}>
        {/* {data.map((x, i) => (
          <Animated.View
            key={x}
            style={[
              {
                position: 'absolute',
                height: 50,
                width: 400,
                // borderRadius: height,
                backgroundColor:
                  this.props.backgroundColor == 'Pomodoro'
                    ? '#BA4849'
                    : this.props.backgroundColor == 'Short_Break'
                    ? '#94bdc0'
                    : '#95B2C7',
              },
              {
                zIndex:
                  i === this.state.activeIndex.current
                    ? 0
                    : i === this.state.activeIndex.previous
                    ? -1
                    : -2,

                transform: [
                  {
                    scale:
                      i === this.state.activeIndex.current ? this.scale : 1,
                  },
                ],
              },
            ]}
          />
        ))} */}
        <Text style={styles.headerTitle}>Promofocus</Text>

        <Menu style={{marginTop: 2}}>
          <MenuTrigger>
            <Image
              source={require('../assets/image/dots.png')}
              style={{height: 20, width: 20, marginRight: 10}}
            />
          </MenuTrigger>
          <MenuOptions style={{marginTop: 1}}>
            <MenuOption onSelect={() => this.props.isOpen(true)}>
              <Text
                style={{
                  color: '#000',
                  fontSize: 15,
                  fontWeight: '700',
                  padding: 8,
                  borderBottomWidth:1,borderColor:'#ccc'
                }}>
                Setting
              </Text>
            </MenuOption>
            <MenuOption onSelect={() => this.props.isReportModalOpen(true)}>
              <Text
                style={{
                  color: '#000',
                  fontSize: 15,
                  fontWeight: '700',
                  padding: 8,
                }}>
                Report
              </Text>
            </MenuOption>
            {/* <MenuOption>
              <Text style={{color: '#000'}}>Profile</Text>
            </MenuOption> */}
            {/* <MenuOption onSelect={() => alert(`Not called`)} text="LogIn" /> */}
          </MenuOptions>
        </Menu>
      </View>
    );
  }
}
