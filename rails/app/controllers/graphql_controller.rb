class GraphqlController < ApplicationController
  # If accessing from outside this domain, nullify the session
  # This allows for outside API access while preventing CSRF attacks,
  # but you'll have to authenticate your user separately
  # protect_from_forgery with: :null_session

  def execute
    variables = prepare_variables(params[:variables])
    query = params[:query]
    operation_name = params[:operationName]
    context = {
      # Query context goes here, for example:
      current_user: current_user_from_jwt,
    }
    result = BmplFinancesSchema.execute(query, variables: variables, context: context, operation_name: operation_name)
    render json: result
  rescue => e
    raise e unless Rails.env.development?
    handle_error_in_development e
  end

  private

  def current_user_from_jwt
    if request.headers['Authorization'].present?
      begin
        jwt = request.headers['Authorization'].split(' ')[1]
        jwt_payloads = JWT.decode(jwt, 'faba5c848cf90f9bd2d09dd996c76f0912cc775b1d1e460413fd235a0d7cd411f2f07352acd38408df14c7967fa3d893b8ac8d9b15b4f0860359b63847419c04')
        jwt_payload = jwt_payloads.first
        @current_user ||= User.find_by(id: jwt_payload['sub'])
      rescue JWT::ExpiredSignature, JWT::VerificationError, JWT::DecodeError => e
        Rails.logger.warn "JWT authentication failed: #{e.message}"
        nil
      end
    end
  end

  # Handle variables in form data, JSON body, or a blank value
  def prepare_variables(variables_param)
    case variables_param
    when String
      if variables_param.present?
        JSON.parse(variables_param) || {}
      else
        {}
      end
    when Hash
      variables_param
    when ActionController::Parameters
      variables_param.to_unsafe_hash # GraphQL-Ruby will validate name and type of incoming variables.
    when nil
      {}
    else
      raise ArgumentError, "Unexpected parameter: #{variables_param}"
    end
  end

  def handle_error_in_development(e)
    logger.error e.message
    logger.error e.backtrace.join("\n")

    render json: { errors: [{ message: e.message, backtrace: e.backtrace }], data: {} }, status: 500
  end
end
