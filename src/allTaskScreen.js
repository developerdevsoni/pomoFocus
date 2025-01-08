import React, {Component} from 'react';
import {
  Alert,
  Image,
  Text,
  ToastAndroid,
  TouchableOpacity,
  View,
} from 'react-native';
import styles from './styles';
import {getStorage, setStarage} from './util';
import {pomodoroKey} from './constant';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default class AllTaskScreen extends Component {
  constructor(props) {
    super(props);
  }
  componentDidMount() {}

  render() {
    const selectTask = async task => {
      const runingTask = this.props.route.params?.task?.filter(
        item => item.status === true,
      );
      if (runingTask[0]?.id == task.id) {
        this.props.navigation.goBack();
      } else {
        if (this.props.route.params.isRunning) {
          Alert.alert(
            'Current task is running ',
            'You want to end previous Task ?',
            [
              {
                text: 'Yes',
                onPress: async () => {
                  const updatedList = this.props.route.params.task.map(item =>
                    item.id == task.id
                      ? {...item, status: true}
                      : {...item, status: false},
                  );
                  await AsyncStorage.clear();
                  const exitingArr = await getStorage(pomodoroKey);
                  const newStorage = [...exitingArr, ...updatedList];
                  await setStarage(pomodoroKey, newStorage);
                  this.props.navigation.goBack();
                },
              },
              {
                text: 'No',
              },
            ],
          );
          ToastAndroid.show('New Task Start', ToastAndroid.SHORT);
        } else {
          const updatedList = this.props.route.params.task.map(item =>
            item.id == task.id
              ? {...item, status: true}
              : {...item, status: false},
          );
          await AsyncStorage.clear();
          const exitingArr = await getStorage(pomodoroKey);
          const newStorage = [...exitingArr, ...updatedList];
          await setStarage(pomodoroKey, newStorage);
          // console.log('updtae', newStorage);
          // console.log('updtae', ...updatedList);
          this.props.navigation.goBack();
        }
      }
    };
    const deleteFile = async item => {
      console.log(item);

      Alert.alert('Delete Task', 'You want to delete file', [
        {
          text: 'Yes',
          onPress: async () => {
            removeRecordingById(this.props.route.params.task, item.id);
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
      this.props.navigation.goBack();
      return;
    };
    return (
      <View style={{marginHorizontal: 20, marginTop: 10}}>
        <Text style={[styles.addTaskText, {paddingVertical: 0}]}>All Task</Text>
        {this.props.route.params.task.map((item, index) => {
          return (
            <TouchableOpacity
              style={[
                styles.allTaskView,
                {backgroundColor:item.status == true ?  '#e0eeef': '#f5e5e5'},
              ]}
              key={index}
              onPress={() => selectTask(item)}
              activeOpacity={0.8}>
              <View>
                <Text style={{fontWeight: '500', textTransform: 'capitalize'}}>
                  {item.task}
                </Text>
                <Text style={{color: '#000'}}>{item.yourWork}</Text>
              </View>
              <View
                style={{
                  marginRight: 10,
                  flexDirection: 'row',
                  paddingVertical: 10,
                }}>
                <Text style={{color: '#000', marginRight: 20}}>
                  Pomodoro- {item?.estPomodoro}
                </Text>
                <TouchableOpacity onPress={() => deleteFile(item)}>
                  <Image
                    source={require('../assets/image/delete.png')}
                    style={{height: 20, width: 20, alignSelf: 'flex-end'}}
                  />
                </TouchableOpacity>
              </View>
              {item.status == true && (
                <Text style={styles.runningText}>Running</Text>
              )}
            </TouchableOpacity>
          );
        })}
        {this.props.route.params.task.length == 0 && (
          <View>
            <Text
              style={{
                fontSize: 14,
                fontWeight: '600',
                textAlign: 'center',
                marginTop: 20,
              }}>
              No Task Found.
            </Text>
          </View>
        )}
      </View>
    );
  }
}


