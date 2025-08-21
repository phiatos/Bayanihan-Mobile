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
        borderColor: "#ccc",
        borderWidth: borderWidth.thin,
        borderRadius: 10,
        paddingLeft: 10,
        fontSize: 15,
        color: "#444",
        backgroundColor: "#fff",
        width: "100%",
        marginBottom: 20,
        fontFamily: 'Poppins_Regular'
    },
    button: {
        backgroundColor: "#14AFBC",
        paddingVertical: 15,
        width: '100%',
        borderRadius: 10,
        marginBottom: 10,
    },
    label: {
        alignSelf: "flex-start",
        fontSize: 14,
        color: "#333",
        marginBottom: 5,
        fontFamily: 'Poppins_Bold'
    },
});