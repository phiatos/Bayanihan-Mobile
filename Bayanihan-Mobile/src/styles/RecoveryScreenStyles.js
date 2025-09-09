import { StyleSheet } from 'react-native';
import Theme from '../constants/theme';

const borderWidth = {
  thin: 1,
  medium: 2,
  thick: 3,
};

export default StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "flex-start",
        alignItems: "center",
        backgroundColor: "#FFF7EC",
        padding: 26,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 60,
        width: "100%",
        position: "relative",
    },
    backButton: {
        position: 'absolute',
        zIndex: 1,
        left: 10,
        top: 25,
        padding: 10,
        paddingTop: 25,
    },
    title: {
        fontSize: 26,
        color: '#14AFBC',
        textAlign: 'center',
        width: '100%',
        paddingTop: 20,
        fontFamily: 'Poppins_Medium',
    },
    titleSecondary: {
        fontSize: 28,
        fontWeight: "bold",
        marginTop: 20,
        color: "#333",
    },
    descSecondary: {
        fontSize: 16,
        color: "#444",
        marginTop: 20,
        marginBottom: 30,
        textAlign: "center",
        fontFamily: 'Poppins_Regular'
    },
    optionContent: {
        width: "100%",
        alignItems: "center",
    },
    description: {
        fontSize: 14,
        textAlign: 'center',
        color: "#444",
        marginTop: 20,
        marginBottom: 20,
        fontFamily: 'Poppins_Regular'
    },
    input: {
        height: 50,
        borderColor: 'rgba(86, 82, 82, 0.24)',
        borderWidth: 1,
        borderRadius: 10,
        paddingLeft: 10,
        fontSize: 15,
        color: Theme.colors.lightBlack,
        backgroundColor:Theme.colors.white,
        width: "100%",
        marginBottom: 20,
        fontFamily: 'Poppins_Regular',
        elevation: 1,
        shadowColor: Theme.colors.black, // iOS shadow
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
    },
    button: {
        backgroundColor: "#14AFBC",
        paddingVertical: 15,
        width: '100%',
        borderRadius: 10,
        marginBottom: 10,
    },
    buttonText: {
        textAlign: "center",
        color: "#fff",
        fontFamily: 'Poppins_SemiBold',
        fontSize: 16,
    },
    label: {
        alignSelf: "flex-start",
        fontSize: 14,
        color: Theme.colors.accent,
        marginBottom: 5,
        fontFamily: 'Poppins_Bold'

    },
});