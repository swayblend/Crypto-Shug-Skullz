import { useState, useEffect } from 'react'
import { Row, Col, Spinner } from 'react-bootstrap'
import Countdown from 'react-countdown'
import Web3 from 'web3'

// Import Images + CSS
import twitter from '../images/socials/twitter.svg'
import instagram from '../images/socials/instagram.svg'
import opensea from '../images/socials/opensea.svg'
import showcase from '../images/showcase.png'
import opener from '../images/opener.png'
import self from '../images/self.png'
import '../App.css'

// Import Components
import Navbar from './Navbar'

// Import ABI + Config
import CryptoShugSkullz from '../abis/CryptoShugSkullz.json'
import config from '../config.json'

function App() {
	const [web3, setWeb3] = useState(null)
	const [cryptoShugSkullz, setCryptoShugSkullz] = useState(null)

	const [supplyAvailable, setSupplyAvailable] = useState(0)

	const [account, setAccount] = useState(null)
	const [networkId, setNetworkId] = useState(null)
	const [ownerOf, setOwnerOf] = useState([])

	const [explorerURL, setExplorerURL] = useState('https://etherscan.io')
	const [openseaURL, setOpenseaURL] = useState('https://testnets.opensea.io')
	const [goerlifaucetURL, setGoerlifaucetURL] = useState('https://goerlifaucet.com')

	const [isMinting, setIsMinting] = useState(false)
	const [isError, setIsError] = useState(false)
	const [message, setMessage] = useState(null)

	const [currentTime, setCurrentTime] = useState(new Date().getTime())
	const [revealTime, setRevealTime] = useState(0)

	const [counter, setCounter] = useState(7)
	const [isCycling, setIsCycling] = useState(false)

	const loadBlockchainData = async (_web3, _account, _networkId) => {
		// Fetch Contract, Data, etc.
		try {
			const cryptoShugSkullz = new _web3.eth.Contract(CryptoShugSkullz.abi, CryptoShugSkullz.networks[_networkId].address)
			setCryptoShugSkullz(cryptoShugSkullz)

			const maxSupply = await cryptoShugSkullz.methods.maxSupply().call()
			const totalSupply = await cryptoShugSkullz.methods.totalSupply().call()
			setSupplyAvailable(maxSupply - totalSupply)

			const allowMintingAfter = await cryptoShugSkullz.methods.allowMintingAfter().call()
			const timeDeployed = await cryptoShugSkullz.methods.timeDeployed().call()
			setRevealTime((Number(timeDeployed) + Number(allowMintingAfter)).toString() + '000')

			if (_account) {
				const ownerOf = await cryptoShugSkullz.methods.walletOfOwner(_account).call()
				setOwnerOf(ownerOf)
				console.log(ownerOf)
			} else {
				setOwnerOf([])
			}

		} catch (error) {
			setIsError(true)
			setMessage("Contract not deployed to current network, please change network in MetaMask")
		}
	}

	const loadWeb3 = async () => {
		if (typeof window.ethereum !== 'undefined') {
			const web3 = new Web3(window.ethereum)
			setWeb3(web3)

			const accounts = await web3.eth.getAccounts()
			console.log(accounts)

			if (accounts.length > 0) {
				setAccount(accounts[0])
			} else {
				setMessage('Please connect with MetaMask')
			}

			const networkId = await web3.eth.net.getId()
			setNetworkId(networkId)

			if (networkId !== 5777) {
				setExplorerURL(config.NETWORKS[networkId].explorerURL)
				setOpenseaURL(config.NETWORKS[networkId].openseaURL)
			}

			await loadBlockchainData(web3, accounts[0], networkId)

			window.ethereum.on('accountsChanged', function (accounts) {
				setAccount(accounts[0])
				setMessage(null)
			})

			window.ethereum.on('chainChanged', (chainId) => {
				// Handle the new chain.
				// Correctly handling chain changes can be complicated.
				// We recommend reloading the page unless you have good reason not to.
				window.location.reload();
			})
		}
	}

	// MetaMask Login/Connect
	const web3Handler = async () => {
		if (web3) {
			const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
			setAccount(accounts[0])
		}
	}

	const mintNFTHandler = async () => {
		if (revealTime > new Date().getTime()) {
			window.alert('Minting is not live yet!')
			return
		}

		if (ownerOf.length > 10) {
			window.alert('You\'ve already minted 10, your max!')
			return
		}

		// Mint NFT
		if (cryptoShugSkullz && account) {
			setIsMinting(true)
			setIsError(false)

			await cryptoShugSkullz.methods.mint(1).send({ from: account, value: 0 })
				.on('confirmation', async () => {
					const maxSupply = await cryptoShugSkullz.methods.maxSupply().call()
					const totalSupply = await cryptoShugSkullz.methods.totalSupply().call()
					setSupplyAvailable(maxSupply - totalSupply)

					const ownerOf = await cryptoShugSkullz.methods.walletOfOwner(account).call()
					setOwnerOf(ownerOf)
				})
				.on('error', (error) => {
					window.alert(error)
					setIsError(true)
				})
		}

		setIsMinting(false)
	}

	const cycleImages = async () => {
		const getRandomNumber = () => {
			const counter = (Math.floor(Math.random() * 1000)) + 1
			setCounter(counter)
		}

		if (!isCycling) { setInterval(getRandomNumber, 3000) }
		setIsCycling(true)
	}

	useEffect(() => {
		loadWeb3()
		cycleImages()
	}, [account]);

	return (
		<div>
			<Navbar web3Handler={web3Handler} account={account} explorerURL={explorerURL} />
			<main>
				<section id='welcome' className='welcome'>

					<Row className='header my-3 p-3 mb-0 pb-0'>
						<Col xs={12} md={12} lg={8} xxl={8}>
							<span style={{color: '#b8860b'}}><h1>Crypto Shug Skullz</h1></span>
							<p className='sub-header'><span style={{color: '#87ceeb'}}>Available on 05 / 07 / 22</span></p>
						</Col>
						<Col className='flex social-icons'>
							<a
								href="https://twitter.com/swayblend"
								target='_blank'
								className='circle flex button'>
								<img src={twitter} alt="Twitter" />
							</a>
							<a
								href="https://www.instagram.com/swayblend.ai/"                                                                                             
								target='_blank'
								className='circle flex button'>
								<img src={instagram} alt="Instagram" />
							</a>
							<a
								href={`${openseaURL}/collection/${config.PROJECT_NAME}`}
								target='_blank'
								className='circle flex button'>
								<img src={opensea} alt="Opensea" />
							</a>
						</Col>
					</Row>

					<Row className='flex m-3'>
						<Col md={5} lg={4} xl={5} xxl={4} className='text-center'>
							<img
								src={opener}
								alt="Crypto Shug Skullz"
								className='showcase'
							/>     
						</Col>
						<Col md={5} lg={4} xl={5} xxl={4}>
							{revealTime !== 0 && <Countdown date={currentTime + (revealTime - currentTime)} className='countdown mx-3' />}
							<p className='text'>
								<h3><span style={{color: '#87ceeb'}}>Would you like your own unique Crypto Shug Skull Avatar?</span></h3>
							</p>
							<a href="#about" className='button mx-3'>Learn More!</a>
						</Col>
					</Row>

				</section>
				<section id='about' className='about'>

					<Row className='flex m-3'>
						<h2 className='text-center p-3'><span style={{color: '#b8860b'}}>About the Collection</span></h2>
						<Col md={5} lg={4} xl={5} xxl={4} className='text-center'>
							<img src={showcase} alt="Multiple Crypto Shug Skullz" className='showcase' />
						</Col>
						<Col md={5} lg={4} xl={5} xxl={4}>
							{isError ? (
								<p>{message}</p>
							) : (
								<div>
									<h3><span style={{color: '#87ceeb'}}>Mint your NFT Avatar in</span></h3>
									{revealTime !== 0 && <Countdown date={currentTime + (revealTime - currentTime)} className='countdown' />}
									<span style={{color: '#87ceeb'}}><ul>
										<li>1,000 uniquely generated Crypto Shug Skull images now in supply!</li>
										<li>Each web3 address can mint up to 10 NFT's on the Goerli testnet.</li>
										<li>Images were created using an art generator</li>
									        to help facilitate the randomization of attributes.	
										<li>Art is inspired by Day of the Dead Sugar Skulls.</li>
										<li>Viewable on OpenSea shortly after minting.</li>
										<li>Requires Web3 wallet and Goerli test eth for gas on the Goerli network.</li> 
										(for test eth, go to the Goerli faucet link at the bottom of this page)
					  					<li>See the link to the smart contract address for verification on Etherscan.</li>
										(at the bottom of this page if logged in)
									</ul></span>

									{isMinting ? (
										<Spinner animation="border" className='p-3 m-2' />
									) : (
										<button onClick={mintNFTHandler} className='button mint-button mt-3'>Mint</button>
									)}

									{ownerOf.length > 0 &&
										<p><small>View your NFT on
											<a
												href={`${openseaURL}/assets/${cryptoShugSkullz._address}/${ownerOf[0]}`}
												target='_blank'
												style={{ display: 'inline-block', marginLeft: '3px' }}>
												OpenSea
											</a>
										</small></p>}
								</div>
							)}
						</Col>
					</Row>


				</section>
				<section id='about' className='about'>

					<Row className='flex m-3'>
						<h2 className='text-center p-3'><span style={{color: '#b8860b'}}>About the Artist</span></h2>
						<Col md={5} lg={4} xl={5} xxl={4} className='text-center'>
							<img src={self} alt="Selfie" className='showcase' />
						</Col>
						<Col md={5} lg={4} xl={5} xxl={4}>
							{isError ? (
								<p>{message}</p>
							) : (
								<div>
									<h3><span style={{color: '#87ceeb'}}>Andrew Lucero...</span></h3>
									<ul><span style={{color: '#87ceeb'}}>
										<li>Is a graphic designer and blockchain developer.</li>
										<li>Enjoys using his illustration skills in the web3 space.</li>
										<li>Has indepth knowledge of creating etherium NFT projects from start to finish.</li>
									</span></ul>
									    <a href= "mailto:andrewlucero411@gmail.com" className='button'>Get In Touch</a>
								</div>
							)}
						</Col>
					</Row>

					<Row style={{ marginTop: "100px" }}>
						<Col>
							{goerlifaucetURL &&
								<a
									href={`${goerlifaucetURL}`}
									target='_blank'
									className='text-center'>
									{'https://goerlifaucet.com'}
								</a>
							}
							
							{cryptoShugSkullz &&
								<a
									href={`${explorerURL}/address/${cryptoShugSkullz._address}`}
									target='_blank'
									className='text-center'>
									{cryptoShugSkullz._address}
								</a>
							}
						</Col>
					</Row>

				</section>
			</main>
			<footer>

			</footer>
		</div>
	)
}

export default App
