const fileService = require('../services/fileService')
const config = require('config')
const fs = require('fs')
const {User} = require('../model/user')
const File = require('../model/file')
const Uuid = require('uuid')
const archiver = require('archiver');
const path = require('path')

const FileTypes = require('../utils/types')

function getGroupNameByType(type){
    switch (Object.keys(FileTypes).find(key => FileTypes[key].includes(type)) || '') {
        case 'image':
            return 'Image';
        case 'document':
            return 'Document';
        case 'table':
            return 'Excel';
        case 'pdf':
            return 'PDF';
        case 'text':
            return 'Text';
        case 'rar':
            return 'Archive';
        case 'audio':
            return 'Audio';
        case 'video':
            return 'Video';
        case 'presentation':
            return 'Presentation';
        case 'webPage':
        case 'database':
        case 'iso':
        case 'vector':
        case 'torrent':
        case 'scan':
        case 'ebook':
        case 'photoshop':
            return 'All';
    }
}

function clientTypeToServer(type){
    switch (type) {
        case 'Image':
            return 'image';
        case 'Document':
            return 'document';
        case 'Excel':
            return 'table';
        case 'PDF':
            return 'pdf';
        case 'Text':
            return 'text';
        case 'Archive':
            return 'rar';
        case 'Audio':
            return 'audio';
        case 'Video':
            return 'video';
        case 'Presentation':
            return 'presentation';
        case 'All':
            return 'all';
    }
}

function selectColorByGroupName(name){
    switch (name) {
        case 'Image':
            return '#F6AD00';
        case 'Video':
            return '#8289AD';
        case 'Audio':
            return '#F16C00';
        case 'PDF':
            return '#FA4E4E';
        case 'Presentation':
            return '#FF9333';
        case 'Text':
            return '#8289AD';
        case 'Document':
            return '#4876F9';
        case 'Excel':
            return '#32BD7A';
        case 'Archive':
            return '#576A95';
        case 'All':
            return '#AAAAAA';
    }
}

function convertBytesToUnits(bytes) {
    const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    let unitIndex = 0;
    
    while (bytes >= 1024 && unitIndex < units.length - 1) {
      bytes /= 1024;
      unitIndex++;
    }
  
    return `${bytes.toFixed(2)} ${units[unitIndex]}`
}
  
function convertObjectValues(inputObject) {
    const convertedArray = [];
  
    for (const key in inputObject) {
      if (inputObject.hasOwnProperty(key)) {
        const originalValue = inputObject[key];
        const convertedValue = convertBytesToUnits(originalValue);
        convertedArray.push({
            name: key,
            size: originalValue,
            label: convertedValue,
            color: selectColorByGroupName(key)
        });
      }
    }
  
    return convertedArray;
}
  

class FileController {
    async createDir(req, res) {
        try {
            const {name, type, parent} = req.body
            const file = await new File({name, type, parent, user: req.user.id})
            const parentFile = await File.findOne({_id: parent})
            if(!parentFile) {
                file.path = name
                await fileService.createDir(file)
            } else {
                file.path = `${parentFile.path}/${file.name}`
                await fileService.createDir(file)
                parentFile.childs.push(file._id)
                await parentFile.save()
            }
            await file.save()
            return res.json(file)
        } catch (e) {
            console.log(e)
            return res.status(400).json(e)
        }
    }

    async getFiles(req, res) {
        try {
            const {sort} = req.query
            let files
            switch (sort) {
                case 'name':
                    files = await File.find({user: req.user.id, parent: req.query.parent}).sort({name:1})
                    break
                case 'type':
                    files = await File.find({user: req.user.id, parent: req.query.parent}).sort({type:1})
                    break
                case 'date':
                    files = await File.find({user: req.user.id, parent: req.query.parent}).sort({date:1})
                    break
                default:
                    files = await File.find({user: req.user.id, parent: req.query.parent})
                    break;
            }

            return res.json(files)
        } catch (e) {
            console.log(e)
            return res.status(500).json({message: "Can not get files"})
        }
    }

    async allFiles(req, res) {
        try {
            let files = await File.find({user: req.user.id});
            return res.json(files)
        } catch (e) {
            console.log(e)
            return res.status(500).json({message: "Can not get files"})
        }
    }


    async moveFile(req, res) {
        try {

            const newParent = await File.findOne({_id: req.body.parent === "null" ? null : req.body.parent}),
                  moveFile = await File.findById(req.body.file),
                  user = await User.findById(req.user.id)


            console.log(newParent)
            console.log(moveFile)

            
            let newPath;
            let oldPath;

            if (newParent) {
                newPath = `${config.get('filePath')}/${user._id}/${newParent.path}/${moveFile.name}`
                oldPath = `${config.get('filePath')}/${user._id}/${moveFile.path}`
            } else {
                newPath = `${config.get('filePath')}/${user._id}/${moveFile.name}`
                oldPath = `${config.get('filePath')}/${user._id}/${moveFile.path}`
            }

            if (fs.existsSync(path)) {
                return res.status(400).json({message: 'Cant move file, folder already exist file with this name!'})
            }

            fs.renameSync(oldPath, newPath);

            if (moveFile.type === 'dir') {
                const regex = new RegExp('^' + moveFile.path + '/', 'i');
                const childs = await File.find({ path: { $regex: regex } });
            
                // console.log(childs);
            
                for (let file of childs) {
                    const newElementPath = file.path.replace(moveFile.path, (newParent) ? (newParent.path + '/' + moveFile.name) : moveFile.name);


                    console.log(`${file.path} => ${newElementPath}` )


                    file.path = newElementPath;
                    await file.save();
                }
            }

            moveFile.path = (newParent) ? newParent?.path + '/' + moveFile.name : moveFile.name;
            moveFile.parent = (newParent) ? newParent._id : null;
            await moveFile.save();

            return res.json(moveFile)
        } catch (e) {
            console.log(e)
            return res.status(500).json({message: "Can not move file"})
        }
    }

    async uploadFile(req, res) {
        try {

            if(!req?.files?.file){
                return res.status(400).json({ message: 'No file was provided for upload.' });
            }

            const file = req.files.file

            const parent = await File.findOne({user: req.user.id, _id: req.body.parent})
            const user = await User.findOne({_id: req.user.id})


            if (user.usedSpace + file.size > user.diskSpace) {
                return res.status(400).json({message: 'There no space on the disk'})
            }

            await user.updateOne({ $inc: { usedSpace: file.size } });
            

            let path;
            if (parent) {
                path = `${config.get('filePath')}/${user._id}/${parent.path}/${file.name}`
            } else {
                path = `${config.get('filePath')}/${user._id}/${file.name}`
            }

            if (fs.existsSync(path)) {
                return res.status(400).json({message: 'File already exist'})
            }



            const type = file.name.split('.').pop()

            file.mv(path)

            let filePath = file.name
            if (parent) {
                filePath = parent.path + "/" + file.name
            }
            const dbFile = await new File({
                name: file.name,
                type: type,
                size: file.size,
                path: filePath,
                parent: parent?._id,
                user: user._id
            });

            await dbFile.save()
            user.files.push(dbFile._id);
            await user.save()

            return res.json(dbFile)

        } catch (e) {
            return res.status(500).json({message: "Upload error"})
        }
    }


    async changeComment(req, res){
        try{

            const user = await User.findById(req.user.id);
            const text = req.body.text;
            const date = new Date();
            const file = await File.findById(req.body.id);

            file.comment.text = text;
            file.comment.lastEdit = date;

            file.save();

            return res.json({message: 'Comment was saved!'})
        }catch(e){
            console.log(e)
            console.log('Error')
            return res.status(500).json({message: "Comment error"})
        }
    }

    async getComment(req, res){
        try{
            const file = await File.findById(req.query.id);

            return res.json(file.comment)
        }catch(e){
            
            return res.status(500).json({message: "Comment error"})
        }
    }

    async downloadFile(req, res) {
        try {
            const file = await File.findOne({ _id: req.query.id, user: req.user.id });
            const filePath = fileService.getPath(file);
            const isDirectory = fs.lstatSync(filePath).isDirectory();
        
            if (!isDirectory) {
              // Если это не папка, скачиваем файл как обычно
              return res.download(filePath, file.name);
            }
        
            const zipFileName = `${file.name}.zip`;
            const tempFolderPath = path.join(__dirname, '..', 'files', 'temp');
            const zipPath = path.join(tempFolderPath, zipFileName);
        
            if (!fs.existsSync(tempFolderPath)) {
              fs.mkdirSync(tempFolderPath);
            }
        
            const output = fs.createWriteStream(zipPath);
            const archive = archiver('zip', { zlib: { level: 9 } });
        
            output.on('close', function () {
              console.log('Архив успешно создан:', zipPath);
              res.download(zipPath, zipFileName, function () {
                // Удаляем временный архив после скачивания
                fs.unlink(zipPath, function (err) {
                  if (err) {
                    console.error('Ошибка при удалении временного архива:', err);
                  }
                });
              });
            });
        
            archive.on('error', function (err) {
              console.error('Ошибка при создании архива:', err);
              res.status(500).json({ message: 'Ошибка при создании архива' });
            });
        
            archive.on('end', function () {
              console.log('Архив успешно завершен.');
              output.end(); // Завершить поток записи после успешного завершения архивации
            });
        
            archive.pipe(output);
            await archive.directory(filePath, file.name); // Добавляем папку и её содержимое в архив
            archive.finalize();
        } catch (e) {
            console.error('Ошибка при скачивании файла или папки:', e);
            res.status(500).json({ message: 'Ошибка при скачивании файла или папки' });
        }
    }

    async deleteFile(req, res) {
        try {
            const file = await File.findOne({_id: req.query.id, user: req.user.id})
            const user = await User.findById(req.user.id);

            console.log(file)

            if (!file) {
                return res.status(400).json({message: 'file not found'})
            }

            await user.updateOne({ $inc: { usedSpace: -file.size } });
            await user.save();

            fileService.deleteFile(file)
            await file.remove()

            return res.json({message: 'File was deleted'})
        } catch (e) {
            console.log(e)
            return res.status(400).json({message: 'Dir is not empty'})
        }
    }

    async moveFileToTrash(req, res) {
        try {
          const fileId = req.query.id;
          const userId = req.user.id;
      
          const sourceFilePath = path.join('./files', userId, fileId);
      
          if (!fs.existsSync(sourceFilePath)) {
            return res.status(400).json({ message: 'Файл не найден' });
          }
      
          const trashFolderPath = path.join('./trash', userId);
      
          if (!fs.existsSync(trashFolderPath)) {
            fs.mkdirSync(trashFolderPath, { recursive: true });
          }
      
          const targetFilePath = path.join(trashFolderPath, fileId);
      
          fs.renameSync(sourceFilePath, targetFilePath);
      
          return res.json({ message: 'Файл был перемещен в папку trash' });
        } catch (error) {
          console.error(error);
          return res.status(500).json({ message: 'Внутренняя ошибка сервера' });
        }
    }

    async deleteDirRecursive(req, res){
        try {
            const user = await User.findById(req.user.id);
            const folder = await File.findOne({_id: req.query.id, user: user._id})
            const files = await File.find({
                user: user._id,
                path: {$regex : "^" + folder.path}
            })
            const arrayFilesId = files.map((el) => el._id);


            let totalSize = 0;

            for(let file of files){
                totalSize += file.size;
                await file.remove();
            }


            await fileService.deleteRecursive(folder)
            await folder.remove();

            user.usedSpace -= totalSize;
            await user.save();

            return res.json({message: 'Nested folder was deleted', deletedIds: arrayFilesId})
        } catch (e) {
            console.log("ERROR")
            console.log(e)
            // return res.status(400).json({message: 'Dir is not empty'})
            return res.status(500).send({message: 'Internal server error!'})
        }
    }

    async searchFile(req, res) {
        try {
            const searchName = req.query.search

            let files = await File.find({user: req.user.id})
            files = files.filter(file => file.name.toLowerCase().includes(searchName.toLowerCase()))

            return res.json(files)
        } catch (e) {
            console.log(e)
            return res.status(400).json({message: 'Search error'})
        }
    }

    async searchType(req, res) {
        try {
            const type = req.query.type;

            let files = await File.find({user: req.user.id})
            files = files.filter(file => FileTypes[clientTypeToServer(type)].includes(file.type.toLowerCase()));

            console.log(files)

            return res.json(files)
        } catch (e) {
            console.log(e)
            return res.status(400).json({message: 'Search error'})
        }
    }

    async inspectDisk(req, res) {
        try{
            const userFiles = await File.find({user: req.user.id})
            const user = await User.findById(req.user.id);
            const space = {};

            for(let file of userFiles){
                if(file.type.toLowerCase() !== 'dir'){
                    if(space[getGroupNameByType(file.type.toLowerCase())]){
                        space[getGroupNameByType(file.type.toLowerCase())] += file.size;
                    }else{
                        space[getGroupNameByType(file.type.toLowerCase())] = file.size;
                    }
                }
            }

            const diskAnalyticArray = convertObjectValues(space);
            diskAnalyticArray.push({
                name: 'Empty',
                size: user.diskSpace - user.usedSpace,
                label: convertBytesToUnits(user.diskSpace - user.usedSpace),
                color: "#e6e6e6",
            })
            
            return res.json(diskAnalyticArray);
        }catch(e){
            console.log(e)
            return res.status(400).json({message: 'Search error'})
        }
    }
}

module.exports = new FileController()
