import { ScrollView, View } from 'react-native';
import StatusScrim from '../components/StatusScrim';
import AppText from '../components/ui/AppText';
import GradientHeader from '../components/ui/GradientHeader';
import { t } from '../constants/strings';
import { styles } from './TasksScreen.styles';

const TasksScreen = () => (
    <View style={styles.screen}>
        <StatusScrim />
        <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <GradientHeader>
                <AppText variant="h1" tone="inverse">
                    {t.tasksTitle}
                </AppText>
            </GradientHeader>
        </ScrollView>
    </View>
);

export default TasksScreen;
