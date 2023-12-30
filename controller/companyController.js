const { User } = require("../model/user");
const Company = require("../model/company");
const asyncHandler = require("express-async-handler");
const { Department } = require("../model/department");
const Worker = require("../model/worker");

// Check is company already pined to user
const isPinned = async (id) => {
  const item = await Company.findById(id);
  if (item)
    return {
      id: id,
      name: item.name,
      url: item.iconUrl,
      color: item.mainColor,
      description: item.description
    };
};

// desc: Get all companies by user id
// route: GET /api/companies/list?userId
const listCompanyRoute = asyncHandler(async (req, res) => {
  try {
    console.log(req.query);
    // params вспомагательные передаваемые значения для get поиска
    const user = await User.findById(req.query.id);
    if (!user) return res.status(400).send({ message: "Invalid user" });

    // reduce - перебор элементов, содается переменная result, куда записывается результат
    const companies = await Promise.all(
      user.companies.map(async (company) => await isPinned(company))
    );

    return res.status(200).send({ data: companies });
  } catch (err) {
    console.log(err);
    return res.status(500).send({ message: "Iternal server error!" });
  }
});

const updateCompanyRoute = asyncHandler(async(req, res) => {
  try {

    if (req.files) {
      console.log("Update company photo");

      const photo = req.files.file,
        photoRoute = `uploads/companyIcon_${photo.name}`;
      photo.mv(photoRoute, async (err) => {
        if (err) {
          return res.status(500).json({ message: "Error uploading file" });
        }
      });

      await Company.findOneAndUpdate(
        { _id: req.body.id },
        {
          $set: {
            iconUrl: "uploads/companyIcon_" + photo.name,
          },
        },
        { new: true }
      );
    }

    const updated = await Company.findOneAndUpdate(
      { _id: req.body.id },
      {
        $set: {
          name: req.body.name,
          description: req.body.description,
          mainColor: req.body.color
        },
      },
      { new: true }
    );



    return res.status(200).send({ name: updated.name, description: updated.description, color: updated.mainColor, id: updated.id, url: updated.iconUrl });
  } catch (err) {
    console.log(err);
    return res.status(500).send({ message: "Iternal server error!" });
  }
})

// desc: Get curtain company by company document id
// route: GET /api/companies/?id
const companyRoute = asyncHandler(async (req, res) => {
  try {
    // params вспомагательные передаваемые значения для get поиска
    const company = await Company.findById(req.query.id);
    return res.status(200).send({ company: company });
  } catch (err) {
    console.log(err);
    return res.status(500).send({ message: "Iternal server error!" });
  }
});

// desc: Delete company by user and company document id
// route: GET /api/companies/
const deleteCompanyRoute = asyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.query.userId);
    user.companies.pull(req.query.companyId);
    user.save();

    const company = await Company.findById(req.query.companyId);

    for (let workerId of company.employees.map((objectId) =>
      objectId.toString()
    )) {
      await Worker.findById(workerId).remove();
    }

    for (let departmentId of company.departments.map((objectId) =>
      objectId.toString()
    )) {
      await Department.findById(departmentId).remove();
    }

    company.remove();

    return res
      .status(201)
      .send({ message: "Company was deleted successfully" });
  } catch (err) {
    console.log(err);
    return res.status(500).send({ message: "Iternal server error!" });
  }
});

// desc: Add company to user
// route: GET /api/companies/add
const addCompanyRoute = asyncHandler(async (req, res) => {
  try {
    let company = await Company.findOne({ INN: req.body.INN });

    if (!company && req.body.status !== "LIQUIDATED") {

      photoRoute = "uploads/companyPlaceholder.webp";

      if (req.files) {
        const photo = req.files.file;

        photoRoute = `uploads/companyIcon_${photo.name}`;

        photo.mv(photoRoute, async (err) => {
          if (err) {
            return res.status(500).json({ message: "Error uploading file" });
          }
        });
      }

      company = await new Company({ ...req.body, iconUrl: photoRoute }).save();
      
    } else if (req.body.status === "LIQUIDATED")
      return res.status(409).send({ message: "This company was LIQUIDATED" });

    let user = await User.findById(req.query.id);

    if (user.companies.includes(String(company._id))) {
      return res
        .status(409)
        .send({ message: "This company was already pinned to you" });
    }
    user.companies.push(company._id);

    const worker = await new Worker({
      name: user.firstName,
      surname: user.lastName,
      gender: "gender",
      birthday: "birthday",
      companies: user.companies,
      menager: user._id,
      position: "CEO",
      phone: "phone",
      email: user.email,
      image: user.photoUrl,
      password: "admin",
    }).save();

    const department = await new Department({
      name: "CEO",
      head: worker._id,
      departments: [],
      employees: [],
      path: "CEO/",
    }).save();

    worker.department = department._id;
    worker.save();

    company.employees.push(worker._id);
    company.departments.push(department._id);

    company.save();
    user.save();
    return res.status(201).send({
      id: company._id,
      name: company.name,
      url: company.iconUrl,
      color: company.mainColor,
      description: company.description
    });
  } catch (err) {
    console.log(err);
    return res.status(500).send({ message: "Iternal server error!" });
  }
});

// desc: Get list of departments and its head
// route: GET /api/companies/departments
// params: companyId
const getCompanyDepartments = asyncHandler(async (req, res) => {
  try {
    const company = await Company.findById(req.query.id),
      departments = [];

    for (let el of company.departments) {
      let department = await Department.findById(el),
        name = department.name,
        head = await Worker.findById(department.head);

      if (!head) {
        head = await User.findById(department.head);
      }
      const headName = head?.name + " " + head?.surname;

      console.log(department);

      departments.push({
        id: department._id,
        name: name,
        headId: head?._id,
        head_name: headName,
        path: department.path,
      });
    }

    return res.json({
      array: departments.filter((el) => el.headId !== undefined),
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: "Iternal server error!" });
  }
});

const getAllStructureByCompany = asyncHandler(async (req, res) => {
  try {
    const company = await Company.findById(req.query.id),
      departments = [],
      workers = [];

    for (let el of company.departments) {
      let department = await Department.findById(el),
        name = department.name,
        head = await Worker.findById(department.head);

      if (!head) {
        head = await User.findById(department.head);
      }
      const headName = head?.name + " " + head?.surname;

      departments.push({
        id: department._id,
        name: name,
        headId: head?._id,
        head_name: headName,
        path: department.path,
        workers: department.employees,
        departments: department.departments,
      });
    }

    console.log(company)

    for (let el of company.employees) {
      let worker = await Worker.findById(el),
        name = worker.name + " " + worker.surname,
        id = worker.id,
        manager = await Worker.findById(worker.menager),
        manager_id = null,
        manager_name = null;

      console.log(manager);

      if (manager) {
        (manager_id = manager._id),
          (manager_name = manager.name + " " + manager.surname);
      } else {
        (manager_id = worker._id),
          (manager_name = worker.name + " " + worker.surname);
      }

      workers.push({
        id,
        name,
        manager_id,
        manager_name,
        position: worker.position,
      });
    }

    console.log(departments);
    console.log(workers);

    const structure = {
      employees: workers,
      departments: departments,
    };

    return res.json(structure);
  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: "Iternal server error!" });
  }
});

module.exports = {
  listCompanyRoute,
  companyRoute,
  deleteCompanyRoute,
  addCompanyRoute,
  getCompanyDepartments,
  getAllStructureByCompany,
  updateCompanyRoute
};
