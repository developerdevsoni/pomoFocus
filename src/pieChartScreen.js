import React from 'react';
import {
  AppRegistry,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  processColor,
} from 'react-native';

import {PieChart} from 'react-native-charts-wrapper';

class PieChartScreen extends React.Component {
  constructor() {
    super();

    this.state = {
      legend: {
        enabled: true,
        textSize: 15,
        form: 'CIRCLE',

        // horizontalAlignment: 'RIGHT',
        // verticalAlignment: 'CENTER',
        orientation: 'VERTICAL',
        wordWrapEnabled: true,
      },
      data: {
        dataSets: [
          {
            values: [
              {value: 65, label: 'Focus'},
              {value: 21, label: 'Short Break'},
              {value: 25, label: 'Long Break'},
            ],
            label: 'Pomodoro Chart',
            config: {
              colors: [
                processColor('#BA4849'),
                processColor('#4E9196'),
                processColor('#4F7FA2'),
              ],
              valueTextSize: 14,
              valueTextColor: processColor('#fff'),
              sliceSpace: 5,
              selectionShift: 12,

              valueFormatter: "#.#'%'",
              valueLineColor: processColor('#fff'),
              valueLinePart1Length: 0.5,
            },
          },
        ],
      },
      highlights: [{x: 2}],
      description: {
        text: 'Your focus pie chart',
        textSize: 15,
        textColor: processColor('#DDDDD'),
      },
    };
  }

  handleSelect(event) {
    const entry = event.nativeEvent;

    if (entry == null) {
      this.setState({...this.state, selectedEntry: null});
    } else {
      this.setState({...this.state, selectedEntry: JSON.stringify(entry)});
    }

    console.log('event-->', event.nativeEvent);
  }

  render() {
    return (
      <SafeAreaView style={{flex: 1}}>
        <View style={styles.container}>
          <PieChart
            style={styles.chart}
            logEnabled
            chartBackgroundColor={processColor('#fff')}
            chartDescription={this.state.description}
            data={this.state.data}
            legend={this.state.legend}
            highlights={this.state.highlights}
            entryLabelColor={processColor('#fff')}
            entryLabelTextSize={14}
            drawEntryLabels
            rotationEnabled
            rotationAngle={45}
            usePercentValues
            styledCenterText={{
              text: 'Focus',
              color: processColor('#000'),
              size: 20,
            }}
            centerTextRadiusPercent={100}
            holeRadius={30}
            holeColor={processColor('pink')}
            transparentCircleRadius={35}
            transparentCircleColor={processColor('#f0f0f0')}
            maxAngle={350}
            onSelect={this.handleSelect.bind(this)}
            onChange={event => console.log('pi chart --->', event.nativeEvent)}
          />
        </View>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  chart: {
    flex: 1,
  },
});

export default PieChartScreen;
