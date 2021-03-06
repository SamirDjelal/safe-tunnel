import React from 'react';
import Header from "./components/Header";
import Chat from "./components/Chat";
import Connect from "./components/Connect";
import Setting from "./components/Setting";

const ipcRenderer = window.require('electron').ipcRenderer;
const crypto = require('crypto');

class App extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			showSetting: false,
			page: 'connect', // chat, connect
			uid: '',
			name: '',
			messages: [],
			privateKey: null,
			publicKey: null,
			publicKeyServer: null,
			channel: "general"
		}
		this.handleSendMessage = this.handleSendMessage.bind(this);
		this.handleSendFile = this.handleSendFile.bind(this);
		this.handleWSConnect = this.handleWSConnect.bind(this);
		this.toggleSetting = this.toggleSetting.bind(this);
		this.handleChangeChannel = this.handleChangeChannel.bind(this);
	}
	
	componentDidMount() {
		
		ipcRenderer.on('RECEIVE_MESSAGE', (event, args) => {
			console.log(args)
			if (args.body && args.body.length > 0) {
				this.setState(prevState => ({
					messages: [...prevState.messages, args]
				}))
			}
		})
		ipcRenderer.on('RECEIVE_FILE', (event, args) => {
			console.log(args)
			if (args.fileName && args.fileName.length > 0) {
				this.setState(prevState => ({
					messages: [...prevState.messages, args]
				}))
			}
		})
		
		ipcRenderer.on('CONNECTED', (event, args) => {
			this.setState(prevState => ({
				page: 'chat',
				uid: args.uid,
				name: args.name,
				publicKeyServer: args.publicKeyServer,
				messages: [...prevState.messages, {alert: 'you are connected!'}]
			}))
		})
		
		ipcRenderer.on('ALERT', (event, args) => {
			this.setState(prevState => ({
				messages: [...prevState.messages, {alert: args.alert}]
			}))
		})
		
		ipcRenderer.on('KEYS_GENERATED', (event, args) => {
			console.log(args)
			this.setState({
				privateKey: args.privateKey,
				publicKey: args.publicKey
			});
			// if (args.body && args.body.length > 0) {
			// 	this.setState(prevState => ({
			// 		messages: [...prevState.messages, args]
			// 	}))
			// }
		})
		
		
	}
	
	render() {
		return (
			<div className="App relative overflow-hidden pb-2" style={{height: '100%'}}>
				<Header {...this.state} toggleSetting={this.toggleSetting}/>
				{this.state.page === 'connect' && <Connect handleWSConnect={this.handleWSConnect}/>}
				{this.state.page === 'chat' && <Chat {...this.state} handleSendMessage={this.handleSendMessage} handleSendFile={this.handleSendFile}/>}
				<Setting {...this.state} show={this.state.showSetting} handleChangeChannel={this.handleChangeChannel}/>
			</div>
		);
	}
	
	toggleSetting() {
		// console.log('toggleSetting')
		this.setState(prevState => ({showSetting: !prevState.showSetting}))
	}
	
	handleSendMessage(messageField) {
		ipcRenderer.send('SEND_MESSAGE', {
			uid: this.state.uid,
			name: this.state.name,
			channel: this.state.channel,
			body: messageField,
		});
	}
	
	handleSendFile(file) {
		// console.log(window.URL.createObjectURL(file))
		if (file.size > 1024*1024*20) {
			this.setState(prevState => ({
				messages: [...prevState.messages, {alert: 'MAXIMUM FILE SIZE LIMIT IS 20 MB'}]
			}))
			return;
		}
		const reader = new FileReader()
		reader.onload = (e) => {
			// console.log('file loaded ', e.target.result)
			ipcRenderer.send('SEND_FILE', {
				uid: this.state.uid,
				name: this.state.name,
				channel: this.state.channel,
				fileName: file.name,
				fileSize: file.size,
				fileType: file.type,
				fileData: e.target.result
			});
		};
		reader.onerror = (e) => {
			console.error(e)
		}
		reader.readAsDataURL(file);
		
		
	}
	
	
	handleChangeChannel() {
		const channelName = document.getElementById('change-channel').value;
		this.setState({channel: channelName, showSetting: false});
		ipcRenderer.send('CHANGE_CHANNEL', {
			uid: this.state.uid,
			name: this.state.name,
			channel: channelName,
			action: 'channel'
		});
	}
	
	
	
	handleWSConnect() {
		const nameField = document.getElementById('create-name').value.toLowerCase();
		const uidField = crypto.createHash('sha256').update(nameField).digest('hex');
		
		ipcRenderer.send('CONNECT', {
			uid: uidField,
			name: nameField,
			channel: this.state.channel,
			action: 'connect'
		});
	}
	
}

export default App;
