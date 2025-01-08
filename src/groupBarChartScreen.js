import moment from 'moment';
import React from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
  processColor,
} from 'react-native';

import {BarChart} from 'react-native-charts-wrapper';
import {getStorage} from './util';
import {pomodoroKey} from './constant';
import styles from './styles';

class GroupBarChartScreen extends React.Component {
  constructor() {
    super();
    this.state = {
      allTaslData: '',
      Average: {
        focusTime: 0,
        breakTime: 0,
        longBreak: 0,
      },
      legend: {
        enabled: true,
        textSize: 14,
        form: 'SQUARE',
        formSize: 14,
        xEntrySpace: 10,
        yEntrySpace: 5,
        wordWrapEnabled: true,
      },
      data: {
        dataSets: [
          {
            values: [20, 0, 0, 0, 0, 0, 0],
            label: 'Focus Time',
            config: {
              drawValues: true,
              color: processColor('#BA4849'),
              barShadowColor: processColor('#BA4849'),
              highlightColor: processColor('#BA4849'),
            },
          },
          {
            values: [10, 0, 0, 0, 0, 0, 0],
            label: 'Short Break',
            config: {
              drawValues: true,
              color: processColor('#4E9196'),
            },
          },
          {
            values: [4, 0, 0, 0, 0, 0, 0],
            label: 'Long break',
            config: {
              drawValues: true,
              colors: [processColor('#4F7FA2')],
            },
          },
        ],
        config: {
          barWidth: 0.2,
          group: {
            fromX: 0,
            groupSpace: 0.1,
            barSpace: 0.1,
          },
        },
      },
      xAxis: {
        valueFormatter: [
          // moment().subtract(7, 'day').format('DD-MMM'),
          // moment().subtract(6, 'day').format('DD-MMM'),
          moment().subtract(5, 'day').format('DD-MMM'),
          moment().subtract(4, 'day').format('DD-MMM'),
          moment().subtract(3, 'day').format('DD-MMM'),
          moment().subtract(2, 'day').format('DD-MMM'),
          moment().subtract(1, 'day').format('DD-MMM'),
          moment().format('DD-MMM'),
        ],
        granularityEnabled: true,
        // granularity: 1,
        axisMaximum: 5,
        axisMinimum: 0,
        centerAxisLabels: true,
      },

      marker: {
        enabled: true,
        markerColor: processColor('#F0C0FF8C'),
        textColor: processColor('#000'),
        markerFontSize: 14,
      },
    };
  }

  componentDidMount() {
    this.setState({
      ...this.state,
      highlights: [
        {x: 1, y: 40},
        {x: 2, y: 50},
      ],
    });
    this.calculateAverage();
    this.getTaskData();
  }

  getTaskData = async () => {
    const exitingArr = await getStorage(pomodoroKey);
    // console.log('rxt-->', exitingArr);

    this.setState({allTaslData: exitingArr});
  };

  handleSelect(event) {
    const entry = event.nativeEvent;
    if (entry == null) {
      this.setState({...this.state, selectedEntry: null});
    } else {
      this.setState({...this.state, selectedEntry: JSON.stringify(entry)});
    }

    console.log(event.nativeEvent);
  }

  calculateAverageValue = values => {
    const totalSum = values.reduce((sum, value) => sum + value, 0);
    return totalSum / values.length;
  };

  calculateAverage = () => {
    const newAverages = {};
    this.state.data.dataSets.forEach(dataset => {
      newAverages[dataset.label.toLowerCase().replace(' ', '')] =
        this.calculateAverageValue(dataset.values);
    });
    this.setState({Average: newAverages});
    // });
  };

  render() {
    return (
      <ScrollView style={{flex: 1}}>
        <Text style={[styles.countText]}>Activity Summery</Text>
        <Text
          style={{
            color: '#000',
            fontSize: 12,
            marginBottom: 8,
          }}>
          *This report will be available when you are logged in
        </Text>

        <View>
          <View style={[styles1.focusView]}>
            <Image
              source={{
                uri: 'https://pomofocus.io/icons/clock-red.png',
              }}
              style={styles1.timerImg}
            />
            <Text style={[styles.countText, {color: 'rgb(213, 117, 114)'}]}>
              _ _ hours focused
            </Text>
          </View>
          <View style={styles1.focusView}>
            <Image
              source={{
                uri: 'https://pomofocus.io/icons/calender-red.png',
              }}
              style={styles1.timerImg}
            />
            <Text style={[styles.countText, {color: 'rgb(213, 117, 114)'}]}>
              _ _ days accessed
            </Text>
          </View>
          <View style={styles1.focusView}>
            <Image
              source={{
                uri: 'https://pomofocus.io/icons/flame-red.png',
              }}
              style={styles1.timerImg}
            />
            <Text style={[styles.countText, {color: 'rgb(213, 117, 114)'}]}>
              _ _ _ _ day streak
            </Text>
          </View>
        </View>
        <Text style={[styles.countText, {marginTop: 8}]}>Focus Hours</Text>
        <Text style={{color: '#000', fontSize: 12}}>
          *This report will be available when you are logged in
        </Text>

        <View style={styles1.container}>
          <BarChart
            style={styles1.chart}
            xAxis={this.state.xAxis}
            data={this.state.data}
            legend={this.state.legend}
            drawValueAboveBar={false}
            onSelect={this.handleSelect.bind(this)}
            onChange={event => console.log(event.nativeEvent)}
            highlights={this.state.highlights}
            marker={this.state.marker}
          />
        </View>
      </ScrollView>
    );
  }
}

const styles1 = StyleSheet.create({
  container: {
    backgroundColor: '#F5FCFF',
    width: '90%',
    height: 300,
    marginBottom: 40,
    marginTop: 30,
  },
  chart: {
    flex: 1,
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
});

export default GroupBarChartScreen;
