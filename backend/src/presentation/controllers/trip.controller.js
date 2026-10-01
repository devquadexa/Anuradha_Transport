const ApiResponse = require('../../application/common/ApiResponse');
const { toTripResponseDto } = require('../../application/dtos/TripDto');
const { parsePagination, buildMeta } = require('../../application/common/Pagination');

class TripController {
  constructor({
    createTripUseCase,
    getTripUseCase,
    listTripsUseCase,
    updateTripUseCase,
    assignTripUseCase,
    updateTripStatusUseCase,
    updateTripDriverDetailsUseCase,
    deleteTripUseCase,
    approveTripUseCase,
    listPendingApprovalsUseCase,
    setEmergencyStopUseCase,
    reorderTripStopsUseCase,
  }) {
    this.createTripUseCase = createTripUseCase;
    this.getTripUseCase = getTripUseCase;
    this.listTripsUseCase = listTripsUseCase;
    this.updateTripUseCase = updateTripUseCase;
    this.assignTripUseCase = assignTripUseCase;
    this.updateTripStatusUseCase = updateTripStatusUseCase;
    this.updateTripDriverDetailsUseCase = updateTripDriverDetailsUseCase;
    this.deleteTripUseCase = deleteTripUseCase;
    this.approveTripUseCase = approveTripUseCase;
    this.listPendingApprovalsUseCase = listPendingApprovalsUseCase;
    this.setEmergencyStopUseCase = setEmergencyStopUseCase;
    this.reorderTripStopsUseCase = reorderTripStopsUseCase;
  }

  create = async (req, res) => {
    const trip = await this.createTripUseCase.execute({ ...req.body, createdBy: req.user.id });
    return ApiResponse.success(res, {
      message: 'Trip created successfully',
      data: toTripResponseDto(trip),
      statusCode: 201,
    });
  };

  getById = async (req, res) => {
    const trip = await this.getTripUseCase.execute(req.params.id, req.user);
    return ApiResponse.success(res, {
      message: 'Trip retrieved successfully',
      data: toTripResponseDto(trip),
    });
  };

  list = async (req, res) => {
    const pagination = parsePagination(req.query);
    const options = {
      ...pagination,
      status: req.query.status,
      approvalStatus: req.query.approvalStatus,
      driverId: req.query.driverId,
      customerId: req.query.customerId,
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
    };
    const { rows, total } = await this.listTripsUseCase.execute(options, req.user);

    return ApiResponse.success(res, {
      message: 'Trips retrieved successfully',
      data: rows.map(toTripResponseDto),
      meta: buildMeta({ page: pagination.page, pageSize: pagination.pageSize, total }),
    });
  };

  update = async (req, res) => {
    const trip = await this.updateTripUseCase.execute(req.params.id, req.body, req.user.id);
    return ApiResponse.success(res, {
      message: 'Trip updated successfully',
      data: toTripResponseDto(trip),
    });
  };

  assign = async (req, res) => {
    const trip = await this.assignTripUseCase.execute(req.params.id, req.body.driverId, req.user.id);
    return ApiResponse.success(res, {
      message: 'Trip assigned successfully',
      data: toTripResponseDto(trip),
    });
  };

  updateStatus = async (req, res) => {
    const trip = await this.updateTripStatusUseCase.execute(
      req.params.id,
      req.body.status,
      req.user,
      { latitude: req.body.latitude, longitude: req.body.longitude },
      { finalOdometerReading: req.body.finalOdometerReading }
    );
    return ApiResponse.success(res, {
      message: 'Trip status updated successfully',
      data: toTripResponseDto(trip),
    });
  };

  updateDriverDetails = async (req, res) => {
    const trip = await this.updateTripDriverDetailsUseCase.execute(
      Number(req.params.id),
      Number(req.params.stopId),
      req.body,
      req.user
    );
    return ApiResponse.success(res, {
      message: 'Stop details updated successfully',
      data: toTripResponseDto(trip),
    });
  };

  approve = async (req, res) => {
    const trip = await this.approveTripUseCase.execute(req.params.id, req.body, req.user);
    return ApiResponse.success(res, {
      message: req.body.approved ? 'Trip approved successfully' : 'Trip rejected',
      data: toTripResponseDto(trip),
    });
  };

  setEmergencyStop = async (req, res) => {
    const trip = await this.setEmergencyStopUseCase.execute(
      req.params.id,
      { active: req.body.active, reason: req.body.reason },
      req.user
    );
    return ApiResponse.success(res, {
      message: req.body.active ? 'Emergency stop activated' : 'Emergency stop cleared',
      data: toTripResponseDto(trip),
    });
  };

  reorderStops = async (req, res) => {
    const trip = await this.reorderTripStopsUseCase.execute(
      Number(req.params.id),
      req.body.stops,
      req.user
    );
    return ApiResponse.success(res, {
      message: 'Stops reordered successfully',
      data: toTripResponseDto(trip),
    });
  };

  listPendingApproval = async (req, res) => {
    const pagination = parsePagination(req.query);
    const { rows, total } = await this.listPendingApprovalsUseCase.execute(pagination);

    return ApiResponse.success(res, {
      message: 'Pending approvals retrieved successfully',
      data: rows.map(toTripResponseDto),
      meta: buildMeta({ page: pagination.page, pageSize: pagination.pageSize, total }),
    });
  };

  remove = async (req, res) => {
    await this.deleteTripUseCase.execute(req.params.id, req.user.id);
    return ApiResponse.success(res, { message: 'Trip deleted successfully' });
  };
}

module.exports = TripController;
