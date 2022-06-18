import { ethers } from 'hardhat'
import { Timidan } from '../typechain'
const fs = require('fs')

async function main() {
  const signers = await ethers.getSigners()
  const CHUNK_SIZE = 24575

  const contract = await ethers.getContractFactory(
    'Timidan',

    signers[0],
  )
  const c = (await contract.deploy()) as Timidan
  await c.deployed()
  console.log(c.address)

  // READ INPUT METADATA FILE AND CONVERT TO BYTES
  let bytes: Uint8Array[] = []
  let rawImageBytes: Uint8Array[] = []
  let metadata = fs.readFileSync(`metadata.txt`, 'utf8')
  let rawSvg = fs.readFileSync(`rawImage.txt`, 'utf8')

  metadata = ethers.utils.toUtf8Bytes(metadata)
  rawSvg = ethers.utils.toUtf8Bytes(rawSvg)

  //metadata
  for (let i = 0; i < metadata.length / CHUNK_SIZE; i++) {
    const end =
      (i + 1) * CHUNK_SIZE < metadata.length
        ? (i + 1) * CHUNK_SIZE
        : metadata.length
    bytes.push(metadata.slice(i * CHUNK_SIZE, end))
  }

  // raw_image
  for (let i = 0; i < rawSvg.length / CHUNK_SIZE; i++) {
    const end =
      (i + 1) * CHUNK_SIZE < rawSvg.length
        ? (i + 1) * CHUNK_SIZE
        : rawSvg.length
    rawImageBytes.push(rawSvg.slice(i * CHUNK_SIZE, end))
  }

  console.log('full metadata needs ', bytes.length, 'contracts for storage')
  console.log('raw image needs ', rawImageBytes.length, 'contracts for storage')

  // SAVE THEM
  for (let i = 0; i < bytes.length; i++) {
    let tx = await c.saveData('dan', i, bytes[i], {
      gasLimit: 10_000_000,
    })
    await tx.wait()
    console.log('metadata fragment ' + i + ' saved')
  }

  for (let i = 0; i < rawImageBytes.length; i++) {
    let tx = await c.saveData('image', i, rawImageBytes[i], {
      gasLimit: 10_000_000,
    })
    await tx.wait()
    console.log('raw_image fragment ' + i + ' saved')
  }
  await new Promise((f) => setTimeout(f, 10000))
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
