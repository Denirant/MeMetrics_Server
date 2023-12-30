const fs = require('fs')
const fs_extra = require('fs-extra');

const File = require('../model/file')
const config = require('config')
const path = require('path');

class FileService {

    createDir(file) {
        const filePath = `${config.get('filePath')}/${file.user}/${file.path}`
        return new Promise(((resolve, reject) => {
            try {
                if (!fs.existsSync(filePath)) {
                    fs.mkdirSync(filePath)
                    return resolve({message: 'File was created'})
                } else {
                    return reject({message: "File already exist"})
                }
            } catch (e) {
                console.log(e)
                return reject({message: 'File error'})
            }
        }))
    }

    deleteFile(file) {
        const path = this.getPath(file)
        if (file.type === 'dir') {
            fs.rmdirSync(path)
        } else {
            fs.unlinkSync(path)
        }
    }


    async deleteRecursive(file){
        const folderPath = this.getPath(file);
        fs_extra.remove(folderPath);   
     }

    getPath(file) {
        // console.log(config.get('filePath') + '/' + file.user + '/' + file.path)
        return config.get('filePath') + '/' + file.user + '/' + file.path
    }
}


module.exports = new FileService()
