set(SRCS
    "src/builder/widget.cpp"
    "src/widgets/widget.cpp"
    "src/gridui.cpp"
)

idf_component_register(
    SRCS ${SRCS}
    INCLUDE_DIRS "./src"
    REQUIRES esp_timer RB3201-RBProtocol-library
    EMBED_FILES ${CMAKE_CURRENT_BINARY_DIR}/combined.js.gz ${CMAKE_CURRENT_BINARY_DIR}/index.html.gz
)

file(GLOB_RECURSE gridui_web_sources ${COMPONENT_DIR}/web/*)

find_package (Python3 COMPONENTS Interpreter Development)

add_custom_command(
    OUTPUT ${CMAKE_CURRENT_BINARY_DIR}/combined.js.gz ${CMAKE_CURRENT_BINARY_DIR}/index.html.gz
    DEPENDS ${gridui_web_sources}
    COMMAND ${Python3_EXECUTABLE} ${COMPONENT_DIR}/rbgridui_post_extra_script.py generate -o ${CMAKE_CURRENT_BINARY_DIR}
)

target_compile_options(${COMPONENT_LIB} PRIVATE -DRBGRIDUI_USING_ESP_IDF=1)
