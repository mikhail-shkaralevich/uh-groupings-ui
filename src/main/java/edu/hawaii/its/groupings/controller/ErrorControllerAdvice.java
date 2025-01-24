package edu.hawaii.its.groupings.controller;

import java.io.IOException;
import java.time.LocalDateTime;

import jakarta.mail.MessagingException;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import edu.hawaii.its.groupings.access.User;
import edu.hawaii.its.groupings.access.UserContextService;
import edu.hawaii.its.groupings.service.EmailService;
import edu.hawaii.its.api.type.ApiError;

@ControllerAdvice
@Component
public class ErrorControllerAdvice {

    private static final Log logger = LogFactory.getLog(ErrorControllerAdvice.class);

    private final UserContextService userContextService;

    private final EmailService emailService;

    public ErrorControllerAdvice(UserContextService userContextService, EmailService emailService) {
        this.userContextService = userContextService;
        this.emailService = emailService;
    }

    @ExceptionHandler(WebClientResponseException.class)
    public ResponseEntity<ApiError> handleWebClientResponseException
            (WebClientResponseException wcre) {
        emailService.sendWithStack(wcre, "Web Client Response Exception");

        logger.info("WebClientResponseException is handled by the controller");

        ApiError.Builder errorBuilder = new ApiError.Builder()
                .status((HttpStatus) wcre.getStatusCode())
                .message("Web Client Response Exception")
                .debugMessage(wcre.getMessage())
                .timestamp(LocalDateTime.now());
        ApiError apiError = errorBuilder.build();

        String customLogMessage = null;
        if (apiError.getStatus() == HttpStatus.CONFLICT)
            customLogMessage = "409 CONFLICT: Max number of allowed owners is exceeded.";

        return buildResponseEntity(apiError, wcre, customLogMessage);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiError> handleIllegalArgumentException(IllegalArgumentException iae, WebRequest request) {
        emailService.sendWithStack(iae, "Illegal Argument Exception");

        ApiError.Builder errorBuilder = new ApiError.Builder()
                .status(HttpStatus.NOT_FOUND)
                .message("Resource not available")
                .debugMessage(iae.getMessage())
                .timestamp(LocalDateTime.now());

        ApiError apiError = errorBuilder.build();

        return buildResponseEntity(apiError, iae, null);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleException(Exception exception) {
        emailService.sendWithStack(exception, "Exception");

        ApiError.Builder errorBuilder = new ApiError.Builder()
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .message("Exception")
                .debugMessage(exception.getMessage())
                .timestamp(LocalDateTime.now());

        ApiError apiError = errorBuilder.build();

        return buildResponseEntity(apiError, exception, null);
    }


    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ApiError> handleRuntimeException(Exception exception) {
        emailService.sendWithStack(exception, "Runtime Exception");

        ApiError.Builder errorBuilder = new ApiError.Builder()
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .message("Runtime Exception")
                .debugMessage(exception.getMessage())
                .timestamp(LocalDateTime.now());

        ApiError apiError = errorBuilder.build();

      return buildResponseEntity(apiError, exception, null);
    }

    @ExceptionHandler({MessagingException.class, IOException.class})
    public ResponseEntity<ApiError> handleMessagingException(Exception e) {
        emailService.sendWithStack(e, "Messaging Exception");

        ApiError.Builder errorBuilder = new ApiError.Builder()
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .message("Mail service exception")
                .debugMessage(e.getMessage())
                .timestamp(LocalDateTime.now());

        ApiError apiError = errorBuilder.build();

      return buildResponseEntity(apiError, e, null);
    }

    @ExceptionHandler(UnsupportedOperationException.class)
    public ResponseEntity<ApiError> handleUnsupportedOperationException(UnsupportedOperationException nie) {
        emailService.sendWithStack(nie, "Unsupported Operation Exception");

        ApiError.Builder errorBuilder = new ApiError.Builder()
                .status(HttpStatus.NOT_IMPLEMENTED)
                .message("Method not implemented")
                .debugMessage(nie.getMessage())
                .timestamp(LocalDateTime.now());

        ApiError apiError = errorBuilder.build();

        return buildResponseEntity(apiError, nie, null);
    }

    private ResponseEntity<ApiError> buildResponseEntity(ApiError apiError, Throwable cause, String customLogMessage) {

        String uid = null;
        User user = userContextService.getCurrentUser();
        if (user != null) {
            uid = user.getUid();
        }

        if (customLogMessage != null)
            logger.error("uid: " + uid + "; Exception: " + customLogMessage);
        else
            logger.error("uid: " + uid + "; Exception: ", cause);

        return new ResponseEntity<>(apiError, apiError.getStatus());
    }
}
