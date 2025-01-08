import React, {Component} from 'react';
import {
  Text,
  TouchableOpacity,
  View,
  Animated,
  TouchableWithoutFeedback,
  TextInput,
  Image,
  Switch,
  ScrollView,
  Alert,
  FlatList,
  Dimensions,
  StyleSheet,
} from 'react-native';
import Header from './header';
import styles from './styles';
import BackgroundTimer from 'react-native-background-timer';
import SoundPlayer from 'react-native-sound-player';
import {MenuProvider} from 'react-native-popup-menu';
import {Dropdown} from 'react-native-element-dropdown';
import Modal from 'react-native-modal';
import NotificationSounds, {
  playSampleSound,
  stopSampleSound,
} from 'react-native-notification-sounds';
import FastImage from 'react-native-fast-image';
import {getStorage, setStarage} from './util';
import {pomodoroKey, pomodoroTheamKey} from './constant';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import {Slider} from '@rneui/themed';
import {VolumeManager} from 'react-native-volume-manager';
import notifee from '@notifee/react-native';
import moment from 'moment';
import GroupBarChartScreen from './groupBarChartScreen';
import BarChartScreen from './barChartScreen';
import PieChartScreen from './pieChartScreen';
// import {LineChart} from 'react-native-charts-wrapper';

const {width, height} = Dimensions.get('window');
const dotWidth = 20;
export default class HomePage extends Component {
  constructor(props) {
    super(props);

    this.state = {
      time: '',
      breakTime: '',
      longBreak: '',
      isRunning: false,
      isPaused: false,
      currentTimer: 'Pomodoro',
      shortBreakCount: 0,
      pomodoroCount: 0,
      onOpenBottomSheet: false,
      entries: '',
      runningTask: '',
      task: '',
      yourWork: '',
      estPomodoro: 1,
      emptyError: false,
      isSettingModal: false, //false
      isReportModal: true, //false
      customPomodoro: 15 * 60,
      customShortBreak: 5 * 60,
      customLongBreak: 12 * 60,
      totalPomodoro: 0,
      autoStartbreak: true,
      autoStartPomodoro: true,
      longBreakInterval: 1,
      autoCheckTask: false,
      autoSwitchTask: false, //true
      alarmSoundList: [],
      isOpenAlarmSoundList: false,
      selectAlarmSound: '',
      isTickingSound: false,
      setTickingSound: '',
      isOpenComplateTaskModal: false,
      setTimeFormat: '24-hour',
      setTheme: '#C25C5C', //'#C25C5C'
      setShortBreakTheam: '#4E9196',
      setLongBreakTheam: '#4F7FA2',
      setRemainder: 5,
      shortScaled: false,
      pomodoroScaled: false,
      longScaled: false,
      showDetail: false,
      isTheamModalOpen: false, //false
      theamModalTital: 'Pomodoro',
      theamList: '',
      isStorageSet: false,
      setRemainderText: 'last',
      activeIndex: {current: 0, previous: null},
      springValue: new Animated.Value(1),
      deviceVolume: 5,
      deviceVolumeTicking: 3,
      active: 0,
    };

    this.interval = null;
    this.unsubscribe = null;
    this.scale = new Animated.Value(1);
    this.scaleScreen = new Animated.Value(1);
    this.textSize = new Animated.Value(16);
    this.longBreakTextSize = new Animated.Value(16);
    this.pomodoroTextSize = new Animated.Value(20);
    this.timerSize = new Animated.Value(16);
    this.longBreakTimerSize = new Animated.Value(16);
    this.pomodoroTimerSize = new Animated.Value(65);
    this.TimerSize = new Animated.Value(16);
    this.headerScrollView = React.createRef();
    this.itemScrollView = React.createRef();
    this.animationActive = true;
    this.animationActiveRef = null;
  }

  componentDidUpdate(_, prevState) {
    const {currentTimer} = this.state;
    const isShortBreak = currentTimer === 'Short_Break';
    const isLongBreak = currentTimer === 'Long_Break';

    if (prevState.currentTimer !== currentTimer) {
      if (isShortBreak) {
        this.animateView(isShortBreak);
      } else if (isLongBreak) {
        this.longBreakAnimateView(isLongBreak);
      } else {
        this.animateView(false);
        this.longBreakAnimateView(false);
        this.pomodorokAnimateView(false);
      }
      if (isShortBreak || isLongBreak) {
        this.pomodorokAnimateView(true);
      }
    }
    if (this.state.isRunning && !prevState.isRunning) {
      this.startTimer();
    } else if (!this.state.isRunning && prevState.isRunning) {
      this.stopTimer();
    }
    if (prevState.onOpenBottomSheet !== this.state.onOpenBottomSheet) {
      if (this.state.onOpenBottomSheet) {
        this.animateIn();
      }
    }
    if (prevState.activeIndex.current !== this.state.activeIndex.current) {
      this.animate();
    }

    if (prevState.currentTimer !== this.state.currentTimer) {
      Animated.spring(this.state.springValue, {
        toValue: 0.97,
        friction: 1,
        useNativeDriver: true,
        duration: 300,
      }).start(() => {
        Animated.spring(this.state.springValue, {
          toValue: 1,
          duration: 300,
          friction: 1,
          useNativeDriver: true,
        }).start();
      });
    }
    const {sliderWidth} = this.state;
    if (sliderWidth != prevState.sliderWidth) {
      this.pan.setValue({x: (sliderWidth - dotWidth) * this.progress, y: 0});
    }
    if (prevState.active !== this.state.active) {
      this.headerScrollView.current.scrollToIndex({
        index: this.state.active,
        viewPosition: 0.5,
      });
    }
  }
  componentDidMount() {
    this.setState({
      time: 15 * 60,
      breakTime: 5 * 60,
      longBreak: 12 * 60,
      customPomodoro: 15 * 60,
      customShortBreak: 5 * 60,
      customLongBreak: 12 * 60,
    });
    this.notificationSoundsList();

    this.animate();
    const {navigation} = this.props;
    this.unsubscribe = navigation.addListener('focus', this.handleFocus);
    if (this.state.isRunning) {
      this.interval = setInterval(() => {
        this.onDisplayNotification();
      }, this.state.setRemainder * 60000);
    }
  }
  componentWillUnmount() {
    this.onTimeUpdate(this.state.time);
    this.stopTimer();
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }

  onDisplayNotification = async () => {
    await notifee.requestPermission();

    const channelId = await notifee.createChannel({
      id: 'default',
      name: 'Default Channel',
    });

    await notifee.displayNotification({
      title: 'Pomodoro',
      body: 'Your Task is running',
      android: {
        channelId,
        smallIcon: 'ic_launcher',
        pressAction: {
          id: 'default',
        },
      },
    });
  };

  onTimeUpdate = value => {
    const timeInSeconds = parseInt(value);
    this.stopTimer();
    this.setState({time: timeInSeconds});
  };

  handleFocus = () => {
    const {customPomodoro, customShortBreak, customLongBreak} = this.state;
    this.updateTaskList();
    this.setState({
      pomodoroCount: 0,
      shortBreakCount: 0,
      time: customPomodoro,
      breakTime: customShortBreak,
      longBreak: customLongBreak,
    });
  };

  pomodorokAnimateView = isPomodoroBreak => {
    this.setState({pomodoroScaled: isPomodoroBreak});
    Animated.parallel([
      Animated.timing(this.pomodoroTextSize, {
        toValue: isPomodoroBreak ? 16 : 20,
        useNativeDriver: false,
      }),
      Animated.timing(this.pomodoroTimerSize, {
        toValue: isPomodoroBreak ? 16 : 65,
        useNativeDriver: false,
      }),
    ]).start(() => {
      this.setState({pomodoroScaled: isPomodoroBreak});
    });
  };

  longBreakAnimateView = isLongBreak => {
    this.setState({longScaled: isLongBreak});
    Animated.parallel([
      Animated.timing(this.longBreakTextSize, {
        toValue: isLongBreak ? 20 : 16,
        useNativeDriver: false,
      }),
      Animated.timing(this.longBreakTimerSize, {
        toValue: isLongBreak ? 65 : 16,
        useNativeDriver: false,
      }),
    ]).start(() => {
      this.setState({longScaled: isLongBreak});
    });
  };

  animateView = isShortBreak => {
    this.setState({shortScaled: isShortBreak});
    const {shortScaled} = this.state;
    Animated.parallel([
      Animated.spring(this.scaleScreen, {
        toValue: isShortBreak ? 1 : 2,
        useNativeDriver: true,
      }),
      Animated.timing(this.textSize, {
        toValue: isShortBreak ? 20 : 16,
        useNativeDriver: false,
        duration: 300,
      }),

      Animated.timing(this.timerSize, {
        toValue: isShortBreak ? 65 : 16,
        useNativeDriver: false,
        duration: 300,
      }),
    ]).start(() => {
      this.setState({shortScaled: isShortBreak});
    });
  };

  updateTaskList = async () => {
    const exitingArr = await getStorage(pomodoroKey);
    const selectRunningTast = exitingArr.filter(item => item.status === true);
    // console.log(exitingArr);

    this.setState({
      entries: exitingArr,
      runningTask: selectRunningTast,
    });
  };

  updatedRunningTask = async () => {
    const exitingArr = await getStorage(pomodoroKey);
    const totalTimeValue = {
      time: this.state.pomodoroCount,
      shortBreak: this.state.shortBreakCount,
      longBreak: this.state.longBreakInterval - 1,
    };
    const updatedList = exitingArr.map(item =>
      item.id == this.state.runningTask[0].id
        ? {...item, isComplate: true, totalTime: totalTimeValue}
        : null,
    );
    const currentIndex = updatedList.findIndex(item => item.status === true);
    if (currentIndex !== -1) {
      updatedList[currentIndex].status = false;
    }
    const nextIndex = (currentIndex + 1) % updatedList.length;
    updatedList[nextIndex].status = true;
    const selectRunningTast = updatedList.filter(item => item.status === true);

    await AsyncStorage.clear();
    const newStorage = [...updatedList];
    await setStarage(pomodoroKey, newStorage);
    this.setState({
      entries: updatedList,
      runningTask: selectRunningTast,
      pomodoroCount: 0,
      shortBreakCount: 0,
    });
  };

  notificationSoundsList = async () => {
    const setTheme = await AsyncStorage.getItem('setTheam');
    const theamListArr = [
      {id: 1, theam: '#AF4E91', select: false},
      {id: 2, theam: '#BA4849', select: true},
      {id: 3, theam: '#C25C5C', select: false},
      {id: 4, theam: '#9B8238', select: false},
      {id: 5, theam: '#508A58', select: false},
      {id: 6, theam: '#397097', select: false},
      {id: 7, theam: '#38848A', select: false},
    ];
    if (!setTheme) {
      const exitingTheamArr = await getStorage(pomodoroTheamKey);
      const newStorage = [...exitingTheamArr, ...theamListArr];
      await setStarage(pomodoroTheamKey, newStorage);
      this.setState({isStorageSet: true});
      await AsyncStorage.setItem('setTheam', 'true');
    }
    const TheamArr = await getStorage(pomodoroTheamKey);
    const exitingArr = await getStorage(pomodoroKey);
    const soundsList = await NotificationSounds.getNotifications('alarm');

    let allSound = soundsList.map(function (ele) {
      return {...ele, select: false};
    });
    const updatedData = allSound.map((item, index) => ({
      ...item,
      select: index === 0,
    }));
    let updatedList = [];
    let selectedItems = '';
    let selectRunningTast = '';

    if (exitingArr.length > 0) {
      updatedList = exitingArr.map((item, index) => ({
        ...item,
        status: index === 0,
      }));
    }
    selectedItems = updatedData.filter(item => item.select === true);
    selectRunningTast = updatedList.filter(item => item.status === true);
    const selectTheam = TheamArr.filter(item => item.select === true);

    await setStarage(pomodoroKey, updatedList);
    this.setState({
      alarmSoundList: updatedData,
      selectAlarmSound: selectedItems,
      entries: updatedList,
      runningTask: selectRunningTast,
      theamList: TheamArr,
      setTheme: selectTheam[0].theam,
    });
  };

  animateIn = () => {
    const translateY = new Animated.Value(300);
    Animated.spring(translateY, {
      toValue: 10,
      useNativeDriver: true,
      delay: 300,
    }).start();
  };
  animate = () => {
    this.scale.setValue(0);
    Animated.spring(this.scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 1,
      bounciness: 1500,
    }).start();
  };

  addEntry = async () => {
    const {
      task,
      yourWork,
      estPomodoro,
      customPomodoro,
      customShortBreak,
      customLongBreak,
    } = this.state;
    if (task && yourWork) {
      const addNewEntry = {
        task,
        yourWork,
        estPomodoro,
        id: new Date().getTime(),
        status: false,
        isComplate: false,
      };
      this.setState({onOpenBottomSheet: false});
      const exitingArr = await getStorage(pomodoroKey);
      const newStorage = [...exitingArr, addNewEntry];
      await setStarage(pomodoroKey, newStorage);
      this.notificationSoundsList();
      this.setState({
        pomodoroCount: 0,
        shortBreakCount: 0,
        time: customPomodoro,
        breakTime: customShortBreak,
        longBreak: customLongBreak,
      });
    } else {
      this.setState({emptyError: true});
    }
  };
  onCloseRequest = () => {
    this.setState({onOpenBottomSheet: false});
  };
  startTimer = () => {
    this.playSound('start');
    this.interval = BackgroundTimer.setInterval(() => {
      this.setState(prevState => {
        const {
          currentTimer,
          time,
          breakTime,
          longBreak,
          customPomodoro,
          customShortBreak,
          customLongBreak,
        } = prevState;

        if (currentTimer === 'Pomodoro' && time > 0) {
          return {time: time - 1};
        } else if (currentTimer === 'Short_Break' && breakTime > 0) {
          return {breakTime: breakTime - 1};
        } else if (currentTimer === 'Long_Break' && longBreak > 0) {
          return {longBreak: longBreak - 1};
        }

        this.transitionTimer();
        this.onScroll({
          nativeEvent: {contentOffset: {x: currentTimer}},
        });
        return {
          time: customPomodoro,
          breakTime: customShortBreak,
          longBreak: customLongBreak,
        };
      });
    }, 1000);
  };

  transitionTimer = async () => {
    const {
      currentTimer,
      pomodoroCount,
      customPomodoro,
      customShortBreak,
      customLongBreak,
      longBreakInterval,
      autoStartbreak,
      autoStartPomodoro,
      entries,
      runningTask,
      autoSwitchTask,
    } = this.state;

    const updatedEntries = [...entries];
    if (currentTimer === 'Pomodoro') {
      if (
        pomodoroCount == (entries.length == 0 ? 2 : runningTask[0]?.estPomodoro)
      ) {
        const totalPomodoro = this.state.totalPomodoro + pomodoroCount;
        this.setState({
          entries: updatedEntries,
          isRunning: autoSwitchTask,
          currentTimer: 'Short_Break',
          time: customPomodoro,
          pomodoroCount: this.state.pomodoroCount + 1,
        });
        console.log('end');
        const exitingArr = await getStorage(pomodoroKey);
        const currentIndex = exitingArr.findIndex(item => item.status === true);
        if (!autoSwitchTask) {
          await AsyncStorage.setItem('totalPomodoro', totalPomodoro);
        }
        if (autoSwitchTask) {
          entries.length > 0 &&
            (this.updatedRunningTask(),
            Toast.show({
              type: 'success',
              text1: 'Task comlplate',
              text2: 'New Task Start',
              text2Style: {color: '#000', fontSize: 10, fontWeight: '600'},
            }));
        }
        return;
      }
      if (pomodoroCount < longBreakInterval) {
        this.setState(prevState => ({
          currentTimer: 'Short_Break',
          isRunning: autoStartbreak,
          breakTime: customShortBreak,
          pomodoroCount: prevState.pomodoroCount + 1,
          totalPomodoro: prevState.totalPomodoro + 1,
          entries: updatedEntries,
        }));
        this.playSound('Short_Break');
      } else {
        this.setState(prevState => ({
          currentTimer: 'Long_Break',
          isRunning: autoStartbreak,
          longBreak: customLongBreak,
          pomodoroCount: prevState.pomodoroCount + 1,
          totalPomodoro: prevState.totalPomodoro + 1,
          entries: updatedEntries,
          longBreakInterval: longBreakInterval + 1,
        }));
        this.playSound('Long_Break');
      }
    } else if (currentTimer === 'Short_Break') {
      this.setState({
        currentTimer: 'Pomodoro',
        isRunning: autoStartPomodoro,
        time: customPomodoro,
        shortBreakCount: this.state.shortBreakCount + 1,
      });

      this.playSound('start');
    } else if (currentTimer === 'Long_Break') {
      this.setState({
        currentTimer: 'Pomodoro',
        isRunning: autoStartPomodoro,
        time: customPomodoro,
        pomodoroCount: pomodoroCount,
        longBreakInterval: longBreakInterval + 1,
      });
      this.playSound('start');
    }
  };
  onScroll = e => {
    const x = e.nativeEvent.contentOffset.x;
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

  openSettingModal = data => {
    this.setState({isSettingModal: data});
  };
  openReportModal = data => {
    this.setState({isReportModal: data});
  };
  stopTimer = () => {
    if (this.interval) {
      BackgroundTimer.clearInterval(this.interval);
      this.interval = null;
    }
    this.updatedRunningTask();
    SoundPlayer.stop();
  };

  playSound = mood => {
    try {
      if (mood === 'start') {
        SoundPlayer.playAsset(require('../assets/sound/start_bell.mp3'));
        setTimeout(() => {
          SoundPlayer.playAsset(require('../assets/sound/tic_tic.mp3'));
        }, 2000);
      } else if (mood === 'Short_Break') {
        SoundPlayer.playAsset(require('../assets/sound/short_ball.mp3'));
        setTimeout(() => {
          SoundPlayer.playAsset(require('../assets/sound/tic_tic.mp3'));
        }, 2000);
      } else if (mood === 'Long_Break') {
        SoundPlayer.playAsset(require('../assets/sound/long_break_end.mp3'));
        setTimeout(() => {
          SoundPlayer.playAsset(require('../assets/sound/tic_tic.mp3'));
        }, 2000);
      }
    } catch (e) {
      console.log(`Cannot play the sound file`, e);
    }
  };

  formatTime = seconds => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  toggleTimer = () => {
    const {isRunning, isPaused, entries, runningTask} = this.state;
    if (
      entries.length === 0 ||
      (entries.length > 0 && runningTask[0].status == true)
    ) {
      if (!isRunning && !isPaused) {
        this.setState({isRunning: true, isPaused: false});
      } else if (isRunning) {
        this.setState({isRunning: false, isPaused: true});
        this.stopTimer();
      } else if (isPaused) {
        this.setState({isRunning: true, isPaused: false});
      }
    } else {
      console.log('else');
    }
  };

  _renderHeading = () => {
    const {entries, runningTask} = this.state;
    return (
      <View>
        <Text
          style={[
            styles.countText,
            {
              textAlign: 'right',
              marginRight: 20,
              textDecorationLine: 'underline',
              paddingTop: 8,
              fontStyle: 'italic',
              textTransform: 'capitalize',
            },
          ]}>
          Task:-{runningTask.length > 0 ? runningTask[0]?.task : 'No Task'}
        </Text>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            paddingHorizontal: 15,
            paddingTop: 8,
          }}>
          <Text style={styles.countText}>
            Pomodoro count: {this.state.pomodoroCount}{' '}
            {entries.length > 0 ? '/' : null}
            {runningTask[0]?.estPomodoro}
          </Text>
          <Text style={styles.countText}>
            Short break count: {this.state.shortBreakCount}
          </Text>
        </View>
      </View>
    );
  };

  _addButtom = () => {
    return (
      <TouchableOpacity
        style={styles.addBtn}
        onPress={() =>
          this.setState(prevState => ({
            onOpenBottomSheet: !prevState.onOpenBottomSheet,
          }))
        }>
        <Text style={{fontSize: 18, fontWeight: '400', color: '#fff'}}>+</Text>
      </TouchableOpacity>
    );
  };

  _renderBottomSheet = () => {
    return (
      <View>
        <Modal
          transparent
          isVisible={this.state.onOpenBottomSheet}
          style={{width: '96%', alignSelf: 'center', marginBottom: -10}}
          animationIn="slideInUp"
          onBackdropPress={() => this.setState({onOpenBottomSheet: false})}
          animationInTiming={300}>
          <TouchableWithoutFeedback
            onClose={() => this.setState({onOpenBottomSheet: false})}>
            <View style={{flex: 1, justifyContent: 'flex-end'}}>
              <Animated.View style={styles.sheet}>
                <Text style={styles.addTaskText}>Add Task</Text>
                <TextInput
                  placeholder="Task Name"
                  style={styles.addTaskField}
                  onChangeText={value => this.setState({task: value})}
                  autoCapitalize="characters"
                />
                <TextInput
                  style={styles.addTaskField}
                  placeholder="What You Working On"
                  onChangeText={value => this.setState({yourWork: value})}
                />
                {this.state.emptyError && (
                  <Text style={{color: 'red', textAlign: 'right'}}>
                    Please enter details
                  </Text>
                )}
                <Text style={styles.addTaskText}>Est Pomodoros</Text>
                <View style={{flexDirection: 'row'}}>
                  <View style={styles.estValue}>
                    <Text style={styles.addTaskText}>
                      {this.state.estPomodoro}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.upDownBtn}
                    onPress={() =>
                      this.setState({estPomodoro: this.state.estPomodoro + 1})
                    }>
                    <Image
                      source={require('../assets/image/up_arrow.png')}
                      style={{height: 20, width: 20}}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.upDownBtn}
                    onPress={() => {
                      if (this.state.estPomodoro > 1) {
                        this.setState({
                          estPomodoro: this.state.estPomodoro - 1,
                        });
                      }
                    }}>
                    <Image
                      source={require('../assets/image/down_arrow.png')}
                      style={{height: 20, width: 20}}
                    />
                  </TouchableOpacity>
                </View>
                <View style={{flexDirection: 'row', justifyContent: 'center'}}>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => this.addEntry()}>
                    <Text style={styles.cancelText}>Add Task</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.cancelBtn, {backgroundColor: '#a29393'}]}
                    onPress={() =>
                      this.setState(prevState => ({
                        onOpenBottomSheet: !prevState.onOpenBottomSheet,
                        emptyError: false,
                      }))
                    }>
                    <Text style={[styles.cancelText, {color: '#000'}]}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </View>
    );
  };

  _renderAllTask = () => {
    const {runningTask, entries} = this.state;

    const deleteFile = async item => {
      Alert.alert('Delete Task', 'You want to delete task ?.', [
        {
          text: 'Yes',
          onPress: async () => {
            removeRecordingById(this.state.entries, item.id);
            getItem();
          },
        },
        {
          text: 'No',
        },
      ]);
    };

    const removeRecordingById = async (recordings, idToRemove) => {
      const newRecordings = recordings.filter(
        recording => recording.id !== idToRemove,
      );
      console.log('Updated recordings:', newRecordings);
      await setStarage(pomodoroKey, newRecordings);
      this.notificationSoundsList();
      return;
    };
    return (
      <View style={{marginHorizontal: 20, marginTop: 10}}>
        <View style={styles.viewAllstyle}>
          <Text style={[styles.addTaskText, {paddingVertical: 0}]}>
            Running Task
          </Text>
          <Text
            style={[styles.addTaskText, {paddingVertical: 0}]}
            onPress={() =>
              this.props.navigation.navigate('All Task', {
                task: this.state.entries,
                isRunning: this.state.isRunning,
              })
            }>
            View All ({entries.length})
          </Text>
        </View>

        {this.state.entries.length > 0 ? (
          <View style={[styles.allTaskView, {backgroundColor: '#e0eeef'}]}>
            <View style={{}}>
              <Text style={{fontWeight: '500', textTransform: 'capitalize'}}>
                {runningTask[0]?.task}
              </Text>
              <Text style={{color: '#000'}}>{runningTask[0]?.yourWork}</Text>
            </View>
            <View
              style={{
                marginRight: 10,
                flexDirection: 'row',
                paddingVertical: 10,
              }}>
              <Text style={{color: '#000', marginRight: 20}}>
                Pomodoro- {runningTask[0]?.estPomodoro}
              </Text>
              <TouchableOpacity onPress={() => deleteFile(...runningTask)}>
                <Image
                  source={require('../assets/image/delete.png')}
                  style={{height: 20, width: 20, alignSelf: 'flex-end'}}
                />
              </TouchableOpacity>
            </View>
            {runningTask[0]?.status == true && (
              <Text style={styles.runningText}>Running</Text>
            )}
          </View>
        ) : (
          <View>
            <Text
              style={{
                fontSize: 14,
                fontWeight: '600',
                textAlign: 'center',
                marginTop: 20,
              }}>
              Click ' + ' to Add task.
            </Text>
          </View>
        )}
      </View>
    );
  };

  _renderSettingTimer = () => {
    let comodoroTime = Math.round(this.state.time / 60);
    let breakTime = Math.round(this.state.breakTime / 60);
    let longBreakTime = Math.round(this.state.longBreak / 60);
    return (
      <View style={{margin: 20}}>
        <Text style={styles.timerText}>TIMER</Text>
        <Text style={[styles.timerText, {color: '#000', marginTop: 10}]}>
          Time (minutes)
        </Text>
        <View style={styles.rowCenter}>
          <Text style={[styles.timerText, {width: '50%'}]}>Pomodoro :</Text>
          <View style={styles.settingPomodoro}>
            <TextInput
              value={String(comodoroTime)}
              style={{color: '#000', width: '60%'}}
              keyboardType="number-pad"
              maxLength={2}
              onChangeText={value => {
                this.setState({
                  time: value == '' ? 0 : parseInt(value) * 60,
                  customPomodoro: value == '' ? 0 : parseInt(value) * 60,
                });
              }}
            />
            <View>
              <TouchableOpacity
                onPress={() =>
                  this.setState({
                    customPomodoro: parseInt(this.state.customPomodoro + 60),
                    time: parseInt(this.state.time + 60),
                  })
                }>
                <Image
                  source={require('../assets/image/arrow-up.png')}
                  style={{height: 10, width: 10, marginBottom: 2}}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  if (this.state.time > 60) {
                    this.setState({
                      customPomodoro: this.state.customPomodoro - 60,
                      time: parseInt(this.state.time - 60),
                    });
                  }
                }}>
                <Image
                  source={require('../assets/image/down.png')}
                  style={{height: 10, width: 10}}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.rowCenter}>
          <Text style={[styles.timerText, {width: '50%'}]}>Short Break :</Text>
          <View style={styles.settingPomodoro}>
            <TextInput
              value={breakTime.toString()}
              style={{color: '#000', width: '60%'}}
              keyboardType="number-pad"
              onChangeText={value =>
                this.setState({
                  breakTime: value == '' ? 0 : parseInt(value) * 60,
                  customShortBreak: value == '' ? 0 : parseInt(value) * 60,
                })
              }
            />
            <View>
              <TouchableOpacity
                onPress={() =>
                  this.setState({
                    customShortBreak: parseInt(
                      this.state.customShortBreak + 60,
                    ),
                    breakTime: parseInt(this.state.breakTime + 60),
                  })
                }>
                <Image
                  source={require('../assets/image/arrow-up.png')}
                  style={{height: 10, width: 10, marginBottom: 2}}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  if (this.state.breakTime > 60) {
                    this.setState({
                      customShortBreak: this.state.customShortBreak - 60,
                      breakTime: parseInt(this.state.breakTime - 60),
                    });
                  }
                }}>
                <Image
                  source={require('../assets/image/down.png')}
                  style={{height: 10, width: 10}}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
        <View style={styles.rowCenter}>
          <Text style={[styles.timerText, {width: '50%'}]}>Long Break :</Text>
          <View style={styles.settingPomodoro}>
            <TextInput
              value={longBreakTime.toString()}
              style={{color: '#000', width: '60%'}}
              onChangeText={value =>
                this.setState({
                  longBreak: value == '' ? 0 : parseInt(value) * 60,
                  customLongBreak: value == '' ? 0 : parseInt(value) * 60,
                })
              }
            />
            <View>
              <TouchableOpacity
                onPress={() =>
                  this.setState({
                    customLongBreak: parseInt(this.state.customLongBreak + 60),
                    longBreak: parseInt(this.state.longBreak + 60),
                  })
                }>
                <Image
                  source={require('../assets/image/arrow-up.png')}
                  style={{height: 10, width: 10, marginBottom: 2}}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  if (this.state.customLongBreak > 60) {
                    this.setState({
                      customLongBreak: this.state.customLongBreak - 60,
                      longBreak: parseInt(this.state.longBreak - 60),
                    });
                  }
                }}>
                <Image
                  source={require('../assets/image/down.png')}
                  style={{height: 10, width: 10}}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
        <View style={[styles.rowCenter, {marginTop: 20}]}>
          <Text style={[styles.timerText, {color: '#000'}]}>
            Auto Start Break
          </Text>
          <Switch
            value={this.state.autoStartbreak}
            onValueChange={() =>
              this.setState({
                autoStartbreak: !this.state.autoStartbreak,
              })
            }
          />
        </View>
        <View style={[styles.rowCenter, {marginTop: 20}]}>
          <Text style={[styles.timerText, {color: '#000'}]}>
            Auto Start Pomodoro
          </Text>
          <Switch
            value={this.state.autoStartPomodoro}
            onValueChange={() =>
              this.setState({
                autoStartPomodoro: !this.state.autoStartPomodoro,
              })
            }
          />
        </View>
        <View style={[styles.rowCenter, {marginTop: 20}]}>
          <Text style={[styles.timerText, {width: '60%', color: '#333333'}]}>
            Long Break Interval :
          </Text>
          <View style={styles.settingPomodoro}>
            <TextInput
              value={this.state.longBreakInterval.toString()}
              style={{color: '#000', width: '60%'}}
              editable={false}
              onChangeText={text => this.setState({longBreakInterval: text})}
            />
            <View>
              <TouchableOpacity
                onPress={() =>
                  this.setState({
                    longBreakInterval: parseInt(
                      this.state.longBreakInterval + 1,
                    ),
                  })
                }>
                <Image
                  source={require('../assets/image/arrow-up.png')}
                  style={{height: 10, width: 10, marginBottom: 2}}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  if (this.state.longBreakInterval > 1) {
                    this.setState({
                      longBreakInterval: this.state.longBreakInterval - 1,
                    });
                  }
                }}>
                <Image
                  source={require('../assets/image/down.png')}
                  style={{height: 10, width: 10}}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  };

  _renderSettingTask = () => {
    return (
      <View style={{margin: 20}}>
        <Text style={styles.timerText}>TASK</Text>
        <View style={[styles.rowCenter, {marginTop: 2}]}>
          <Text style={[styles.timerText, {color: '#000'}]}>
            Auto Check Task
          </Text>
          <Switch
            value={this.state.autoCheckTask}
            onValueChange={() =>
              this.setState({
                autoCheckTask: !this.state.autoCheckTask,
              })
            }
          />
        </View>
        <View style={[styles.rowCenter, {marginTop: 10}]}>
          <Text style={[styles.timerText, {color: '#000'}]}>
            Auto Switch Task
          </Text>
          <Switch
            value={this.state.autoSwitchTask}
            onValueChange={() =>
              this.setState({
                autoSwitchTask: !this.state.autoSwitchTask,
              })
            }
          />
        </View>
      </View>
    );
  };

  _renderSettingSound = () => {
    const handelVolume = async e => {
      this.setState({deviceVolume: e});
      await VolumeManager.setVolume(e);
      SoundPlayer.setVolume(e);
      const get = await VolumeManager.getVolume();
      console.log(get);
    };

    const handelTickingVolume = async e => {
      this.setState({deviceVolumeTicking: e});
      await VolumeManager.setVolume(e);
      SoundPlayer.setVolume(e);
      const get = await VolumeManager.getVolume();
      console.log(get);
    };

    return (
      <View style={{margin: 20}}>
        <Text style={styles.timerText}>Sound</Text>
        <View style={[styles.rowCenter, {marginTop: 2}]}>
          <Text style={[styles.timerText, {color: '#000'}]}>Alarm Sound</Text>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => this.setState({isOpenAlarmSoundList: true})}>
            <Text style={{color: '#333333'}}>
              {this.state.selectAlarmSound[0]?.title}
            </Text>
            <Image
              source={require('../assets/image/up_arrow.png')}
              style={{height: 10, width: 10}}
            />
          </TouchableOpacity>
        </View>
        <View style={styles1.container}>
          <TextInput
            ref={e => (this.textRef = e)}
            defaultValue={this.state.deviceVolume.toString()}
            style={styles1.txt}
            editable={false}
          />
          <Slider
            value={this.state.deviceVolume}
            onValueChange={e => handelVolume(e)}
            step={1}
            maximumValue={10}
            minimumValue={1}
            thumbStyle={{height: 15, width: 15, backgroundColor: 'red'}}
            style={{width: '70%', alignSelf: 'flex-end'}}
          />
        </View>
        {/*=================voluam slider============================  */}

        {/* <View style={styles1.container}>
          <TextInput
            ref={e => (this.textRef = e)}
            defaultValue={this.progress.toString()}
            style={styles1.txt}
            editable={false}
          />
          <View
            style={styles1.barContainer}
            {...this.panResponder.panHandlers}
            onLayout={e => {
              this.setState({sliderWidth: e.nativeEvent.layout.width});
            }}>
            {!!sliderWidth && (
              <Animated.View
                style={[styles1.bar, {transform: [{scaleY: this.scaleY}]}]}>
                <Animated.View
                  style={[
                    styles1.activeLine,
                    {transform: [{translateX: this.translateX}]},
                  ]}
                />
              </Animated.View>
            )}
            {!!sliderWidth && (
              <Animated.View
                style={[
                  styles1.dot,
                  {transform: [{translateX: this.translateX}]},
                ]}
              />
            )}
          </View>
        </View> */}

        <View style={[styles.rowCenter, {marginTop: 10}]}>
          <Text style={[styles.timerText, {color: '#000'}]}>Ticking Sound</Text>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() =>
              this.setState({isOpenAlarmSoundList: true, isTickingSound: true})
            }>
            <Text style={{width: '80%'}}>
              {this.state.setTickingSound
                ? this.state.setTickingSound[0].title
                : 'none'}
            </Text>
            <Image
              source={require('../assets/image/up_arrow.png')}
              style={{height: 10, width: 10}}
            />
          </TouchableOpacity>
        </View>

        <View style={styles1.container}>
          <TextInput
            ref={e => (this.textRef = e)}
            defaultValue={this.state.deviceVolumeTicking.toString()}
            style={styles1.txt}
            editable={false}
          />
          <Slider
            value={this.state.deviceVolumeTicking}
            onValueChange={e => handelTickingVolume(e)}
            step={1}
            maximumValue={10}
            minimumValue={1}
            thumbStyle={{height: 15, width: 15, backgroundColor: 'red'}}
            style={{width: '70%', alignSelf: 'flex-end'}}
          />
        </View>
      </View>
    );
  };
  _renderSettingTheam = () => {
    const timeFormat = [
      {id: 1, label: '24-hour', value: '24-hour'},
      {id: 2, label: '12-hour', value: '12-hour'},
    ];

    return (
      <View style={{margin: 20}}>
        <Text style={styles.timerText}>Theme</Text>
        <View style={[styles.rowCenter, {marginTop: 2, paddingHorizontal: 5}]}>
          <Text style={[styles.timerText, {color: '#000'}]}>Color Themes</Text>
          <View style={styles.rowCenter}>
            <TouchableOpacity
              onPress={() => {
                this.setState({
                  isTheamModalOpen: true,
                  theamModalTital: 'Pomodoro',
                });
              }}
              style={[styles.theamView, {backgroundColor: this.state.setTheme}]}
            />
            <TouchableOpacity
              onPress={() =>
                this.setState({
                  theamModalTital: 'Short Break',
                  isTheamModalOpen: true,
                })
              }
              style={[
                styles.theamView,
                {backgroundColor: this.state.setShortBreakTheam},
              ]}
            />
            <TouchableOpacity
              onPress={() =>
                this.setState({
                  theamModalTital: 'Long Break',
                  isTheamModalOpen: true,
                })
              }
              style={[
                styles.theamView,
                {backgroundColor: this.state.setLongBreakTheam},
              ]}
            />
          </View>
        </View>
        <View style={[styles.rowCenter, {marginTop: 10, paddingHorizontal: 5}]}>
          <Text style={[styles.timerText, {color: '#000'}]}>Hour Format</Text>
          <Dropdown
            dropdownPosition="top"
            style={[styles.dropdownTime]}
            placeholderStyle={styles.placeholderStyle}
            selectedTextStyle={styles.selectedTextStyle}
            iconStyle={styles.iconStyle}
            data={timeFormat}
            value={this.state.setTimeFormat}
            maxHeight={300}
            labelField="label"
            valueField="value"
            placeholder={'Select item'}
            onChange={item => {
              this.setState({setTimeFormat: item.value});
            }}
          />
        </View>
        <View style={[styles.rowCenter, {marginTop: 10, paddingHorizontal: 5}]}>
          <Text style={[styles.timerText, {color: '#000'}]}>
            Dark Mode when running
          </Text>
          <Switch
            value={true}
            // onValueChange={() =>
            //   this.setState({
            //     autoSwitchTask: !this.state.autoSwitchTask,
            //   })
            // }
          />
        </View>
      </View>
    );
  };

  renderTheamModal = () => {
    const selectTheam = thaem => {
      const updatedList = this.state.theamList.map(item =>
        item.id == thaem.id
          ? {...item, select: true}
          : {...item, select: false},
      );

      const selectTheam = updatedList.filter(item => item.select === true);
      if (this.state.theamModalTital == 'Short Break') {
        this.setState({
          theamList: updatedList,
          setShortBreakTheam: selectTheam[0].theam,
        });
      } else if (this.state.theamModalTital == 'Long Break') {
        this.setState({
          theamList: updatedList,
          setLongBreakTheam: selectTheam[0].theam,
        });
      } else {
        this.setState({theamList: updatedList, setTheme: selectTheam[0].theam});
      }
    };
    return (
      <Modal isVisible={this.state.isTheamModalOpen}>
        <View style={{backgroundColor: '#fff', padding: 5, borderRadius: 5}}>
          <Text style={styles.alarmText}>
            Pick a color for {this.state.theamModalTital}
          </Text>
          <FlatList
            data={this.state.theamList}
            numColumns={4}
            renderItem={({item}) => {
              return (
                <TouchableOpacity
                  onPress={() => selectTheam(item)}
                  style={{
                    height: 70,
                    width: 70,
                    backgroundColor: item.theam,
                    margin: 10,
                    borderRadius: 8,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  {item.select ? (
                    <Image
                      source={require('../assets/image/check.png')}
                      style={{height: 20, width: 20, tintColor: '#fff'}}
                    />
                  ) : null}
                </TouchableOpacity>
              );
            }}
          />
          <TouchableOpacity
            onPress={() => {
              this.setState({isSettingModal: false});
              this.setState({isTheamModalOpen: false});
            }}
            style={{
              borderWidth: 1,
              width: '30%',
              padding: 9,
              alignSelf: 'center',
              backgroundColor: '#333333',
              borderRadius: 5,
            }}>
            <Text style={[styles.alarmListOkBtnText]}>OK</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  };
  _renderSettingNotifaction = () => {
    const timeFormat = [
      {id: 1, label: 'Last', value: 'Last'},
      {id: 2, label: 'Every', value: 'Every'},
    ];
    return (
      <View style={{margin: 20}}>
        <Text style={styles.timerText}>Notification</Text>
        <View style={[styles.rowCenter, {marginTop: 2, paddingHorizontal: 5}]}>
          <Text style={[styles.timerText, {color: '#000'}]}>Reminder</Text>
          <View
            style={[styles.rowCenter, {paddingHorizontal: 1, width: '65%'}]}>
            <Dropdown
              dropdownPosition="top"
              style={[styles.dropdownTime, {width: '45%'}]}
              placeholderStyle={styles.placeholderStyle}
              selectedTextStyle={styles.selectedTextStyle}
              iconStyle={styles.iconStyle}
              data={timeFormat}
              value={this.state.setRemainderText}
              maxHeight={300}
              labelField="label"
              valueField="value"
              placeholder={this.state.setRemainderText}
              onChange={item => {
                this.setState({setRemainderText: item.value});
              }}
            />
            <View
              style={[styles.settingPomodoro, {width: '40%', marginTop: 0}]}>
              <TextInput
                value={this.state.setRemainder.toString()}
                style={{color: '#000', width: '60%'}}
                keyboardType="number-pad"
                maxLength={2}
                onChangeText={value => {
                  this.setState({
                    setRemainder: value == '' ? 0 : parseInt(value),
                  });
                }}
              />
              <View>
                <TouchableOpacity
                  onPress={() =>
                    this.setState({
                      setRemainder: parseInt(this.state.setRemainder + 1),
                    })
                  }>
                  <Image
                    source={require('../assets/image/arrow-up.png')}
                    style={{height: 10, width: 10, marginBottom: 2}}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    if (this.state.setRemainder > 1) {
                      this.setState({
                        setRemainder: parseInt(this.state.setRemainder - 1),
                      });
                    }
                  }}>
                  <Image
                    source={require('../assets/image/down.png')}
                    style={{height: 10, width: 10}}
                  />
                </TouchableOpacity>
              </View>
            </View>
            <Text>min</Text>
          </View>
        </View>
      </View>
    );
  };
  _renderSettingModal = () => {
    return (
      <View>
        <Modal
          transparent
          isVisible={this.state.isSettingModal}
          style={{
            width: '94%',
            alignSelf: 'center',
            marginTop: '20%',
            marginBottom: 10,
            borderRadius: 10,
          }}>
          <ScrollView contentContainerStyle={styles.settingView}>
            <View style={{flex: 1}}>
              <Text style={styles.settingStyle}>Setting</Text>
              {this._renderSettingTimer()}
              <View style={styles.divaider} />
              {this._renderSettingTask()}
              <View style={styles.divaider} />
              {this._renderSettingSound()}
              <View style={styles.divaider} />
              {this._renderSettingTheam()}
              <View style={styles.divaider} />
              {this._renderSettingNotifaction()}
              <TouchableOpacity
                style={{position: 'absolute', right: 20, top: 15}}
                onPress={() => this.setState({isSettingModal: false})}>
                <Image
                  source={require('../assets/image/close.png')}
                  style={{width: 20, height: 20}}
                />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  this.componentWillUnmount();
                  this.setState({isSettingModal: false});
                }}
                style={styles.saveBtn}>
                <Text style={{color: '#fff', fontWeight: '600'}}>Save</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Modal>
      </View>
    );
  };

  onPressHeader = index => {
    if (this.animationActiveRef) {
      clearTimeout(this.animationActiveRef);
    }
    if (this.state.active !== index) {
      this.animationActive = false;
      this.animationActiveRef = setTimeout(() => {
        this.animationActive = true;
      }, 400);
      this.itemScrollView.current.scrollToIndex({index});
      this.setState({active: index});
    }
  };

  onScrollReport = e => {
    const x = e.nativeEvent.contentOffset.x;
    const newIndex = Math.floor(x / width + 0.5);
    if (this.state.active !== newIndex && this.animationActive) {
      this.setState({active: newIndex});
    }
  };

  onMomentumScrollEnd = () => {
    this.animationActive = true;
  };

  reportDetailRenderItem = (item, index) => {
    const {entries, time} = this.state;
    return (
      <View key={item} style={styles1.mainItem}>
        <View>
          {index == 0 ? (
            <View style={{paddingVertical: 20, padding: 10}}>
              <View
              // style={{
              //   flex: 1,
              //   width: '90%',
              //   // height: 300,
              //   marginBottom: 40,
              // }}
              >
                <GroupBarChartScreen />
              </View>
            </View>
          ) : index == 1 ? (
            <View style={{paddingVertical: 2, padding: 10, flex: 1}}>
              <Text style={[styles.countText]}>Focus Time Detail</Text>
              <Text style={{color: '#000', fontSize: 12}}>
                *This report will be available when you are logged in
              </Text>
              <View
                style={{
                  borderBottomWidth: 0.9,
                  borderColor: '#ccc',
                }}>
                <View style={{flexDirection: 'row', marginTop: 10}}>
                  <Text style={styles.dateTaskText}>Date</Text>
                  <Text style={[styles.dateTaskText, {width: '55%'}]}>
                    Task/Project
                  </Text>
                  <Text style={styles.dateTaskText}>MINUTES</Text>
                </View>
              </View>
              <FlatList
                data={entries}
                renderItem={({item}) => {
                  return (
                    <View
                      style={{
                        marginTop: 10,
                        flexDirection: 'row',
                      }}>
                      <Text style={styles.dateTaskText}>
                        {moment(item.id).format('DD-MMM')}
                      </Text>
                      <Text
                        style={[
                          styles.dateTaskText,
                          {
                            width: '55%',
                            textTransform: 'capitalize',
                          },
                        ]}>
                        {item.task}
                      </Text>
                      <Text style={styles.dateTaskText}>
                        {item.estPomodoro * (time / 60)}
                      </Text>
                    </View>
                  );
                }}
              />

              <View
                style={{
                  flex: 1,
                  width: '90%',
                  height: 300,
                  marginBottom: 40,
                }}>
                <BarChartScreen />
              </View>
            </View>
          ) : (
            <View style={{paddingVertical: 20, padding: 10}}>
              <Text style={[styles.countText]}>Focus Time This Week</Text>
              <View
                style={{
                  flex: 1,
                  width: '90%',
                  height: 350,
                  marginBottom: 40,
                }}>
                <PieChartScreen />
              </View>
            </View>
          )}
        </View>
      </View>
    );
  };

  _renderReportModal = () => {
    const headers = ['Summary', ' Detail', 'Ranking'];
    const {active} = this.state;
    return (
      <View>
        <Modal
          transparent
          isVisible={this.state.isReportModal}
          style={{
            width: '95%',
            alignSelf: 'center',
            marginTop: '10%',
            marginBottom: 10,
            borderRadius: 10,
          }}>
          <ScrollView contentContainerStyle={styles.settingView}>
            <View style={{flex: 1}}>
              <Text style={styles.settingStyle}>Report</Text>

              <View style={{flex: 1}}>
                <FlatList
                  data={headers}
                  ref={this.headerScrollView}
                  keyExtractor={item => item}
                  horizontal
                  scrollEnabled={false}
                  style={styles1.headerScroll}
                  showsHorizontalScrollIndicator={false}
                  renderItem={({item, index}) => (
                    <View style={{flex: 1}}>
                      <TouchableOpacity
                        onPress={() => this.onPressHeader(index)}
                        key={item}
                        style={[
                          styles1.headerItem,
                          {
                            backgroundColor:
                              active === index ? '#E09B99' : '#fff',
                            paddingHorizontal: index == 1 ? 45 : 30,
                          },
                        ]}>
                        <Text
                          style={{
                            fontSize: 14,
                            color: active === index ? '#fff' : '#000',
                            fontWeight: '600',
                          }}>
                          {item}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                />
                <FlatList
                  data={headers}
                  ref={this.itemScrollView}
                  keyExtractor={item => item}
                  horizontal
                  pagingEnabled
                  decelerationRate="fast"
                  showsHorizontalScrollIndicator={false}
                  onScroll={this.onScrollReport}
                  onMomentumScrollEnd={this.onMomentumScrollEnd}
                  renderItem={({item, index}) =>
                    this.reportDetailRenderItem(item, index)
                  }
                />
              </View>

              <TouchableOpacity
                style={{position: 'absolute', right: 20, top: 15}}
                onPress={() => this.setState({isReportModal: false})}>
                <Image
                  source={require('../assets/image/close.png')}
                  style={{width: 20, height: 20}}
                />
              </TouchableOpacity>

              {/* <TouchableOpacity
                onPress={() => {
                  this.componentWillUnmount();
                  this.setState({isSettingModal: false});
                }}
                style={styles.saveBtn}>
                <Text style={{color: '#fff', fontWeight: '600'}}>Save</Text>
              </TouchableOpacity> */}
            </View>
          </ScrollView>
        </Modal>
      </View>
    );
  };

  _radioButton = props => {
    return (
      <View
        style={[
          {
            height: 24,
            width: 24,
            borderRadius: 12,
            borderWidth: 2,
            borderColor: props ? '#000' : '#ccc',
            alignItems: 'center',
            justifyContent: 'center',
          },
          props.style,
        ]}>
        {props ? (
          <View
            style={{
              height: 12,
              width: 12,
              borderRadius: 6,
              backgroundColor: '#000',
            }}
          />
        ) : null}
      </View>
    );
  };

  _soundListModal = () => {
    const playAudio = audio => {
      const updatedList = this.state.alarmSoundList.map(item =>
        item.soundID == audio.soundID
          ? {...item, select: true}
          : {...item, select: false},
      );
      this.setState({alarmSoundList: updatedList});
      playSampleSound(audio);
    };

    const onPress = () => {
      stopSampleSound();
      const selectedItems = this.state.alarmSoundList.filter(
        item => item.select === true,
      );
      if (this.state.isTickingSound) {
        this.setState({
          isOpenAlarmSoundList: false,
          setTickingSound: selectedItems,
          isTickingSound: false,
        });
      } else {
        this.setState({
          isOpenAlarmSoundList: false,
          selectAlarmSound: selectedItems,
        });
      }
    };

    return (
      <Modal isVisible={this.state.isOpenAlarmSoundList}>
        <View
          style={{backgroundColor: '#fff', borderRadius: 9, paddingBottom: 10}}>
          <Text style={styles.alarmText}>Alarm Sound</Text>
          <FlatList
            data={this.state.alarmSoundList}
            renderItem={({item}) => {
              return (
                <TouchableOpacity
                  onPress={() => playAudio(item)}
                  style={[styles.alarmListView]}>
                  <Text style={styles.soundName}>{item.title}</Text>
                  {this._radioButton(item.select)}
                </TouchableOpacity>
              );
            }}
          />
          <TouchableOpacity
            style={styles.alarmListOkBtn}
            onPress={() => onPress()}>
            <Text style={styles.alarmListOkBtnText}>OK</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  };

  _renderComplateTask = () => {
    const onPress = () => {
      stopSampleSound();
      this.setState({isOpenComplateTaskModal: false});
    };
    return (
      <Modal isVisible={this.state.isOpenComplateTaskModal}>
        <View
          style={{
            flexDirection: 'column',
            backgroundColor: '#fff',
            alignItems: 'center',
            padding: 10,
            borderRadius: 5,
          }}>
          <Text style={[styles.PomodoroText, {color: '#333333'}]}>
            Task Complate
          </Text>
          <FastImage
            source={require('../assets/image/Alarm.gif')}
            resizeMode="contain"
            style={{width: 200, height: 200}}
          />
          <Text style={{fontWeight: '500', textTransform: 'capitalize'}}>
            {this.state.runningTask[0]?.task} is complete!
          </Text>
          <TouchableOpacity
            onPress={() => onPress()}
            style={[styles.startBtn, {backgroundColor: '#333333'}]}>
            <Text style={{color: '#fff'}}>Stop</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  };

  _renderPomodoroTest = () => {
    const {
      time,
      currentTimer,
      isPaused,
      setTheme,
      longBreak,
      breakTime,
      setShortBreakTheam,
      setLongBreakTheam,
      springValue,
    } = this.state;
    const data = ['#C25C5C', '#4E9196', '#4F7FA2'];
    // const { volume } = await VolumeManage.getVolume();
    // console.log(volume);
    return (
      <View>
        <Animated.View
          style={[
            styles.PomodoroView,
            {
              backgroundColor:
                currentTimer == 'Pomodoro'
                  ? setTheme
                  : currentTimer == 'Short_Break'
                  ? setShortBreakTheam
                  : setLongBreakTheam,
              paddingVertical: 25,
              elevation: 5,
              transform: [
                {
                  scale: springValue,
                },
              ],
            },
          ]}>
          {data.map((x, i) => (
            <Animated.View
              key={x}
              style={[
                {
                  position: 'absolute',
                  height: '128%', //(height * 4) / 2,
                  width: '100%',
                  backgroundColor:
                    currentTimer == 'Pomodoro'
                      ? setTheme
                      : currentTimer == 'Short_Break'
                      ? setShortBreakTheam
                      : setLongBreakTheam,
                  borderRadius: 10,
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
          ))}

          <Animated.Text style={[styles.PomodoroText]}>
            {currentTimer == 'Pomodoro'
              ? 'Pomodoro'
              : currentTimer == 'Short_Break'
              ? 'Short Break'
              : 'Long Break'}
          </Animated.Text>
          <Animated.Text style={[styles.counterText]}>
            {this.formatTime(
              currentTimer == 'Pomodoro'
                ? time
                : currentTimer == 'Short_Break'
                ? breakTime
                : longBreak,
            )}
          </Animated.Text>
          <TouchableOpacity style={styles.startBtn} onPress={this.toggleTimer}>
            <Text
              style={[
                styles.satrtText,
                {
                  color:
                    currentTimer == 'Pomodoro'
                      ? setTheme
                      : currentTimer == 'Short_Break'
                      ? setShortBreakTheam
                      : setLongBreakTheam,
                },
              ]}>
              {this.state.isRunning ? 'PAUSE' : isPaused ? 'RESUME' : 'START'}
            </Text>
          </TouchableOpacity>
          {/* )} */}
        </Animated.View>

        {/*============== row fun ================> */}

        <View
          style={{
            flexDirection: 'row', //column' : 'row',
            width: '99%',
          }}>
          <Animated.View
            style={[
              styles.PomodoroView,
              {
                // backgroundColor: this.state.setShortBreakTheam,
                backgroundColor:
                  currentTimer == 'Pomodoro'
                    ? setShortBreakTheam
                    : currentTimer == 'Short_Break'
                    ? setTheme
                    : setTheme,
                paddingVertical: 2, //shortScaled ? 24 : 2,
                width: '46%', //shortScaled || longScaled ? 'auto' : '46%',
                elevation: 5,
              },
            ]}>
            <Animated.Text
              style={[
                styles.PomodoroText,
                {
                  fontSize: 16,
                  // this.textSize
                },
              ]}>
              {currentTimer == 'Pomodoro' ? 'Short Break' : 'Pomodoro'}
            </Animated.Text>
            <Animated.Text
              style={[
                styles.counterText,
                {
                  paddingTop: 0,
                  fontSize: 16, //this.timerSize,
                },
              ]}>
              {this.formatTime(currentTimer == 'Pomodoro' ? breakTime : time)}
            </Animated.Text>
          </Animated.View>

          <Animated.View
            style={[
              styles.PomodoroView,
              {
                backgroundColor:
                  currentTimer == 'Pomodoro'
                    ? setLongBreakTheam
                    : currentTimer == 'Short_Break'
                    ? setLongBreakTheam
                    : setShortBreakTheam,
                // backgroundColor: this.state.setLongBreakTheam,
                // transform: [{scale: this.scaleLongScreen}],
                paddingVertical: 2, //longScaled ? 24 : 2,
                marginHorizontal: 10,
                width: '46%', //shortScaled || longScaled ? 'auto' : '46%',
                elevation: 5,
              },
            ]}>
            <Animated.Text style={[styles.PomodoroText, {fontSize: 16}]}>
              {currentTimer == 'Long_Break' ? 'Short Break' : 'Long Break'}
            </Animated.Text>
            <Animated.Text style={[styles.PomodoroText, {fontSize: 16}]}>
              {this.formatTime(
                currentTimer == 'Long_Break' ? breakTime : longBreak,
              )}
            </Animated.Text>
          </Animated.View>
        </View>
      </View>
    );
  };

  render() {
    const data = ['#C25C5C', '#4E9196', '#4F7FA2'];
    const {currentTimer} = this.state;

    return (
      <MenuProvider>
        <View style={{flex: 1}}>
          {data.map((x, i) => (
            <Animated.View
              key={x}
              style={[
                {
                  position: 'absolute',
                  height: (height * 4) / 1,
                  width: (height * 4) / 1,
                  borderRadius: height,
                  backgroundColor:
                    currentTimer == 'Pomodoro'
                      ? '#DA9D9D'
                      : currentTimer == 'Short_Break'
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
          ))}
          <Header
            backgroundColor={this.state.currentTimer}
            isOpen={this.openSettingModal}
            isReportModalOpen={this.openReportModal}
          />
          {this._renderHeading()}
          {this._renderBottomSheet()}
          {this._renderSettingModal()}
          {this._soundListModal()}
          {this._renderComplateTask()}
          {this.renderTheamModal()}
          {this._renderPomodoroTest()}
          {this._renderAllTask()}
          {this._renderReportModal()}
          {this._addButtom()}
        </View>
      </MenuProvider>
    );
  }
}

const styles1 = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  txt: {
    fontSize: 14,
    color: '#000',
    marginHorizontal: 10,
  },
  headerScroll: {
    // flexGrow: 0,
    borderWidth: 1,
    borderRadius: 8,
    marginHorizontal: 5,
    borderColor: '#C25C5C',
    marginTop: 10,
  },
  headerItem: {
    alignItems: 'center',
    justifyContent: 'space-evenly',
    padding: 10,
    paddingHorizontal: 25,
    borderLeftWidth: 1,
    // borderRightWidth: 1,
    borderColor: '#C25C5C',
  },
  mainItem: {
    width: width,
    // alignItems: 'center',
    // justifyContent: 'space-evenly',
  },
  headerBar: {
    height: 2,
    width: '90%',
    alignSelf: 'center',
    backgroundColor: '#000',
    position: 'absolute',
    bottom: 0,
  },
  focusView: {
    backgroundColor: '#F7E8E6',
    width: '90%',
    padding: 10,
    borderRadius: 5,
    flexDirection: 'row',
    marginVertical: 5,
    paddingVertical: 15,
    justifyContent: 'space-evenly',
    marginLeft: 10,
  },
  timerImg: {
    width: 20,
    height: 20,
  },
});
