const ApiResponse = require('../../application/common/ApiResponse');
const { toCustomerResponseDto } = require('../../application/dtos/CustomerDto');
const { parsePagination, buildMeta } = require('../../application/common/Pagination');

class CustomerController {
  constructor({ createCustomerUseCase, getCustomerUseCase, listCustomersUseCase, updateCustomerUseCase, deleteCustomerUseCase }) {
    this.createCustomerUseCase = createCustomerUseCase;
    this.getCustomerUseCase = getCustomerUseCase;
    this.listCustomersUseCase = listCustomersUseCase;
    this.updateCustomerUseCase = updateCustomerUseCase;
    this.deleteCustomerUseCase = deleteCustomerUseCase;
  }

  create = async (req, res) => {
    const customer = await this.createCustomerUseCase.execute({ ...req.body, createdBy: req.user.id });
    return ApiResponse.success(res, {
      message: 'Customer created successfully',
      data: toCustomerResponseDto(customer),
      statusCode: 201,
    });
  };

  getById = async (req, res) => {
    const customer = await this.getCustomerUseCase.execute(req.params.id);
    return ApiResponse.success(res, {
      message: 'Customer retrieved successfully',
      data: toCustomerResponseDto(customer),
    });
  };

  list = async (req, res) => {
    const pagination = parsePagination(req.query);
    const options = { ...pagination, status: req.query.status };
    const { rows, total } = await this.listCustomersUseCase.execute(options);

    return ApiResponse.success(res, {
      message: 'Customers retrieved successfully',
      data: rows.map(toCustomerResponseDto),
      meta: buildMeta({ page: pagination.page, pageSize: pagination.pageSize, total }),
    });
  };

  update = async (req, res) => {
    const customer = await this.updateCustomerUseCase.execute(req.params.id, req.body, req.user.id);
    return ApiResponse.success(res, {
      message: 'Customer updated successfully',
      data: toCustomerResponseDto(customer),
    });
  };

  remove = async (req, res) => {
    await this.deleteCustomerUseCase.execute(req.params.id, req.user.id);
    return ApiResponse.success(res, { message: 'Customer deleted successfully' });
  };
}

module.exports = CustomerController;
