import { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, DatePicker, DateValue } from "@nextui-org/react";
import { format, startOfDay, endOfDay } from 'date-fns';
import { useSpring, animated } from 'react-spring';
import StatisticsChart from '../components/StatisticsChart';
import useApi from '../hooks/useApi';
import { today } from '@internationalized/date';

interface FocusSession {
  id: string;
  duration: number;
  date: string;
  records: {
    type: 'focus' | 'break';
    duration: number;
    overTime: number;
  }[];
  task: {
    id: string;
    name: string;
  };
}

function StatisticsPage() {
  const [focusSessions, setFocusSessions] = useState<FocusSession[]>([]);
  const api = useApi();

  const [value, setValue] = useState<DateValue>(today("Asia/Tokyo") as unknown as DateValue);

  const fadeIn = useSpring({
    from: { opacity: 0 },
    to: { opacity: 1 },
    config: { duration: 300 },
  });

  useEffect(() => {
    fetchFocusSessions();
  }, [value]);

  const fetchFocusSessions = async () => {
    try {
      const response = await api.get('/focus-sessions', {
        params: {
          startDate: startOfDay(new Date(value.toString())).toISOString(),
          endDate: endOfDay(new Date(value.toString())).toISOString(),
        },
      });
      setFocusSessions(response.data);
    } catch (error) {
      console.error('Failed to fetch focus sessions:', error);
    }
  };

  const totalFocusTime = focusSessions.reduce((total, session) => total + session.duration, 0);
  const averageFocusTime = focusSessions.length > 0 ? totalFocusTime / focusSessions.length : 0;

  const hourlyData = Array.from({ length: 24 }, (_, hour) => { // XXX: ロジックが謎
    // Filter sessions that overlap with the current hour
    const sessionsInHour = focusSessions.filter(session => {
        const sessionStart = new Date(session.date);
        const sessionEnd = new Date(session.date);
        sessionEnd.setMinutes(sessionEnd.getMinutes() + session.duration);

        const startHour = sessionStart.getHours();
        const endHour = sessionEnd.getHours();

        return (startHour <= hour && hour <= endHour);
    });

    // Calculate the total duration for the current hour
    const totalDuration = sessionsInHour.reduce((total, session) => {
        const sessionStart = new Date(session.date);
        const sessionEnd = new Date(session.date);
        sessionEnd.setMinutes(sessionEnd.getMinutes() + session.duration);

        const sessionStartHour = sessionStart.getHours();
        const sessionEndHour = sessionEnd.getHours();

        if (sessionStartHour === sessionEndHour) {
            // If the session is entirely within one hour, add the full duration
            return total + session.duration / 60; // duration in hours
        } else {
            // If the session spans multiple hours, calculate the portion for the current hour
            const hourStart = new Date(sessionStart);
            hourStart.setHours(hour, 0, 0, 0);
            const hourEnd = new Date(hourStart);
            hourEnd.setHours(hour + 1, 0, 0, 0);

            const overlapStart = sessionStart < hourStart ? hourStart : sessionStart;
            const overlapEnd = sessionEnd > hourEnd ? hourEnd : sessionEnd;

            const overlapDuration = (overlapEnd.getTime() - overlapStart.getTime()) / 1000 / 60; // duration in minutes
            return total + Math.max(0, overlapDuration);
        }
    }, 0);

    return { hour, duration: totalDuration };
  });

  return (
    <animated.div style={fadeIn} className="container mx-auto">
      <h1 className="text-3xl font-bold mb-4">Statistics</h1>
      <Card className="mb-4">
        <CardHeader>
          <h2 className="text-2xl font-bold">Date Selection</h2>
        </CardHeader>
        <CardBody>
          <DatePicker
            value={value}
            onChange={(newValue) => setValue(newValue)}
            label="Select a date"
            variant="bordered"
            showMonthAndYearPickers
          />
        </CardBody>
      </Card>

      <Card className="mb-4">
        <CardHeader>
          <h2 className="text-2xl font-bold">Summary</h2>
        </CardHeader>
        <CardBody>
          <div className="flex gap-4 justify-around">
            <Card className="flex-1 text-center shadow-md rounded-lg p-4">
              <CardHeader>Total<p className="text-xs pl-2 hidden sm:block">(min)</p></CardHeader>
              <CardBody className="text-4xl">
                {Math.round(totalFocusTime / 60).toString()}
              </CardBody>
            </Card>
            <Card className="flex-1 text-center shadow-md rounded-lg p-4">
              <CardHeader>Average<p className="text-xs pl-2 hidden sm:block">(min)</p></CardHeader>
              <CardBody className="text-4xl">
                {Math.round(averageFocusTime / 60).toString()}
              </CardBody>
            </Card>
            <Card className="flex-1 text-center shadow-md rounded-lg p-4">
              <CardHeader>Count</CardHeader>
              <CardBody className="text-4xl">
                {focusSessions.length}
              </CardBody>
            </Card>
          </div>
        </CardBody>
      </Card> 

      <Card className="mb-4">
        <CardHeader>
          <h2 className="text-2xl font-bold">Hourly Distribution</h2>
        </CardHeader>
        <CardBody>
          <StatisticsChart data={hourlyData} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-2xl font-bold">Focus Sessions</h2>
        </CardHeader>
        <CardBody>
          <Table>
            <TableHeader>
              <TableColumn>Task</TableColumn>
              <TableColumn>Duration(h:m)</TableColumn>
              <TableColumn>Break count</TableColumn>
              <TableColumn>Time</TableColumn>
            </TableHeader>
            <TableBody>
              {focusSessions.map((session) => (
                console.log(session),
                <TableRow key={session.id} onClick={() => console.log(session)}>
                  <TableCell>{session.task.name}</TableCell>
                  <TableCell>{Math.round(session.duration / 60 / 60).toString().padStart(2, "0")} : {Math.round(session.duration / 60).toString().padStart(2, "0")}</TableCell>
                  <TableCell>{session.records.filter(record => record.type === 'break').length}</TableCell>
                  <TableCell>{format(new Date(session.date), 'HH:mm')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>
    </animated.div>
  );
}

export default StatisticsPage;
